import type { SupabaseClient } from '@supabase/supabase-js'

export type CronJobName =
  | 'webhook_jobs'
  | 'notification_digests'
  | 'account_deletions'
  | 'e2e_cleanup'
  | 'billing_lifecycle'
  | 'early_adopter_lifecycle'
export type CronRunStatus = 'succeeded' | 'failed'

export async function startCronRun(admin: SupabaseClient, jobName: CronJobName) {
  try {
    const { data, error } = await admin
      .from('cron_runs')
      .insert({ job_name: jobName, status: 'running' })
      .select('id')
      .single()

    if (error) return null
    return typeof data?.id === 'string' ? data.id : null
  } catch {
    return null
  }
}

export async function finishCronRun(
  admin: SupabaseClient,
  runId: string | null,
  result: {
    status: CronRunStatus
    processedCount?: number
    sentCount?: number
    errorMessage?: string
    metadata?: Record<string, unknown>
  },
) {
  if (!runId) return

  try {
    await admin
      .from('cron_runs')
      .update({
        status: result.status,
        finished_at: new Date().toISOString(),
        processed_count: Math.max(0, result.processedCount ?? 0),
        sent_count: Math.max(0, result.sentCount ?? 0),
        error_message: result.errorMessage ?? null,
        metadata: result.metadata ?? {},
      })
      .eq('id', runId)
  } catch {
    // Cron audit writes should never change the cron job result.
  }
}
