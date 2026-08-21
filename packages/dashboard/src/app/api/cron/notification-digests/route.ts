import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { finishCronRun, startCronRun } from '@/lib/cron-runs'
import { sendDailyFeedbackDigest } from '@/lib/notifications'
import { verifyBearerSecret } from '@/lib/secret-auth'

function isAuthorized(request: NextRequest) {
  return verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
}

function getDigestWindow() {
  const windowEnd = new Date()
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000)
  return {
    digestDate: windowEnd.toISOString().slice(0, 10),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let admin: Awaited<ReturnType<typeof createAdminSupabase>> | null = null
  let cronRunId: string | null = null

  try {
    admin = await createAdminSupabase()
    cronRunId = await startCronRun(admin, 'notification_digests')
    const { digestDate, windowStart, windowEnd } = getDigestWindow()
    const { data: settingsRows } = await admin
      .from('user_settings')
      .select('user_id, notification_settings')

    const { data: existingDigests } = await admin
      .from('notification_digests')
      .select('user_id')
      .eq('digest_type', 'daily_feedback')
      .eq('digest_date', digestDate)

    const sentUsers = new Set((existingDigests || []).map((row) => row.user_id))
    let processed = 0
    let sent = 0

    for (const row of settingsRows || []) {
      const notificationSettings = row.notification_settings as { dailyDigest?: boolean } | null
      if (!notificationSettings?.dailyDigest) continue
      if (sentUsers.has(row.user_id)) continue

      processed += 1
      const digestResult = await sendDailyFeedbackDigest(row.user_id, windowStart, windowEnd)
      if (!digestResult.sent) continue

      sent += 1
      await admin.from('notification_digests').upsert(
        {
          user_id: row.user_id,
          digest_type: 'daily_feedback',
          digest_date: digestDate,
          window_start: windowStart,
          window_end: windowEnd,
          sent_at: new Date().toISOString(),
          item_count: digestResult.count,
        },
        { onConflict: 'user_id,digest_type,digest_date' },
      )
    }

    await finishCronRun(admin, cronRunId, {
      status: 'succeeded',
      processedCount: processed,
      sentCount: sent,
      metadata: { digestDate, windowStart, windowEnd },
    })

    return NextResponse.json({ processed, sent, digestDate })
  } catch (error) {
    if (admin) {
      await finishCronRun(admin, cronRunId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Internal server error',
      })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
