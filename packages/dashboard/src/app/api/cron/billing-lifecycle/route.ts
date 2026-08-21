import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { finishCronRun, startCronRun } from '@/lib/cron-runs'
import { processBillingLifecycle } from '@/lib/billing-lifecycle'
import { verifyBearerSecret } from '@/lib/secret-auth'

export async function GET(request: NextRequest) {
  if (!verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminSupabase()
  let cronRunId: string | null = null
  try {
    cronRunId = await startCronRun(admin, 'billing_lifecycle')
    const result = await processBillingLifecycle()
    await finishCronRun(admin, cronRunId, {
      status: 'succeeded',
      processedCount: result.processed,
      sentCount: result.noticesSent,
      metadata: result,
    })
    return NextResponse.json(result)
  } catch (error) {
    await finishCronRun(admin, cronRunId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Internal server error',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
