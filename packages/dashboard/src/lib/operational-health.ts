export interface CronHealthRow {
  job_name: string
  status: string
  started_at: string
  finished_at: string | null
}

export function evaluateCronHealth(
  rows: CronHealthRow[],
  now = Date.now(),
): Record<string, { healthy: boolean; lastRunAt: string | null; status: string | null }> {
  const thresholds: Record<string, number> = {
    webhook_jobs: 30 * 60 * 1000,
    notification_digests: 26 * 60 * 60 * 1000,
    e2e_cleanup: 26 * 60 * 60 * 1000,
    account_deletions: 26 * 60 * 60 * 1000,
  }

  return Object.fromEntries(
    Object.entries(thresholds).map(([jobName, threshold]) => {
      const latest = rows.find((row) => row.job_name === jobName)
      const lastRunAt = latest?.finished_at || latest?.started_at || null
      const age = lastRunAt ? now - new Date(lastRunAt).getTime() : Number.POSITIVE_INFINITY
      return [jobName, {
        healthy: latest?.status === 'succeeded' && age <= threshold,
        lastRunAt,
        status: latest?.status || null,
      }]
    }),
  )
}
