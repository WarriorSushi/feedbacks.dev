import { NextRequest, NextResponse } from 'next/server'
import { finishCronRun, startCronRun } from '@/lib/cron-runs'
import { createAdminSupabase } from '@/lib/supabase-server'
import { processWebhookDigests, processWebhookJobs } from '@/lib/webhook-delivery'
import { getRequestId, logOperationalEvent } from '@/lib/operational-logging'
import { operationalRetentionCutoffs } from '@/lib/operational-retention'
import { verifyBearerSecret } from '@/lib/secret-auth'

function isAuthorized(request: NextRequest) {
  return verifyBearerSecret(request.headers.get('authorization'), process.env.CRON_SECRET)
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let admin: Awaited<ReturnType<typeof createAdminSupabase>> | null = null
  let cronRunId: string | null = null

  try {
    admin = await createAdminSupabase()
    cronRunId = await startCronRun(admin, 'webhook_jobs')
    const processed = await processWebhookJobs({ limit: 50 })
    const digestProcessed = await processWebhookDigests({ limit: 100 })
    const cutoffs = operationalRetentionCutoffs()
    const [jobCleanup, cronCleanup] = await Promise.all([
      admin
        .from('webhook_jobs')
        .delete({ count: 'exact' })
        .eq('status', 'succeeded')
        .lt('updated_at', cutoffs.succeededWebhookJobsBefore),
      admin
        .from('cron_runs')
        .delete({ count: 'exact' })
        .lt('started_at', cutoffs.cronRunsBefore),
    ])
    if (jobCleanup.error || cronCleanup.error) {
      logOperationalEvent('warn', 'webhook.retention_cleanup_failed', requestId, {
        webhookJobsError: jobCleanup.error?.message,
        cronRunsError: cronCleanup.error?.message,
      })
    }
    await finishCronRun(admin, cronRunId, {
      status: 'succeeded',
      processedCount: processed.length + digestProcessed.reduce((sum, digest) => sum + digest.itemCount, 0),
      metadata: {
        deliveryStatuses: processed.map((job) => job.status),
        digestStatuses: digestProcessed.map((digest) => ({
          status: digest.status,
          itemCount: digest.itemCount,
        })),
        cleanup: {
          succeededWebhookJobs: jobCleanup.count || 0,
          cronRuns: cronCleanup.count || 0,
        },
      },
    })
    logOperationalEvent('info', 'webhook.cron_completed', requestId, {
      processedJobs: processed.length,
      processedDigestItems: digestProcessed.reduce((sum, digest) => sum + digest.itemCount, 0),
    })
    return NextResponse.json({ processed, digestProcessed })
  } catch (error) {
    if (admin) {
      await finishCronRun(admin, cronRunId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Internal server error',
      })
    }
    logOperationalEvent('error', 'webhook.cron_failed', requestId, {
      error: error instanceof Error ? error.message : 'Internal server error',
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
