import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { processAccountDeletionJobs } from '@/lib/account-deletion'
import { finishCronRun, startCronRun } from '@/lib/cron-runs'
import { getRequestId, logOperationalEvent } from '@/lib/operational-logging'
import { verifyBearerSecret } from '@/lib/secret-auth'

function isAuthorized(request: NextRequest) {
  return verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminSupabase()
  let cronRunId: string | null = null
  try {
    cronRunId = await startCronRun(admin, 'account_deletions')
    const results = await processAccountDeletionJobs(admin, { limit: 25 })
    const summary = {
      processed: results.length,
      completed: results.filter((result) => result.status === 'completed').length,
      failed: results.filter((result) => result.status === 'failed').length,
      blocked: results.filter((result) => result.status === 'blocked').length,
    }
    await finishCronRun(admin, cronRunId, {
      status: 'succeeded',
      processedCount: results.length,
      metadata: summary,
    })
    logOperationalEvent(summary.failed > 0 ? 'warn' : 'info', 'account_deletion.cron_completed', requestId, summary)
    return NextResponse.json(summary)
  } catch (error) {
    await finishCronRun(admin, cronRunId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Account deletion processing failed',
    })
    logOperationalEvent('error', 'account_deletion.cron_failed', requestId, {
      error: error instanceof Error ? error.message : 'Account deletion processing failed',
    })
    return NextResponse.json({ error: 'Account deletion processing failed' }, { status: 500 })
  }
}
