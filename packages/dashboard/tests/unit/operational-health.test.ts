import assert from 'node:assert/strict'
import test from 'node:test'

async function loadOperationalHealth() {
  return import(new URL('../../src/lib/operational-health.ts', import.meta.url).href)
}

test('cron health distinguishes current success from stale or failed jobs', async () => {
  const { evaluateCronHealth } = await loadOperationalHealth()
  const now = Date.parse('2026-07-06T12:00:00.000Z')
  const result = evaluateCronHealth([
    { job_name: 'webhook_jobs', status: 'succeeded', started_at: '2026-07-06T11:50:00.000Z', finished_at: '2026-07-06T11:51:00.000Z' },
    { job_name: 'notification_digests', status: 'failed', started_at: '2026-07-06T10:00:00.000Z', finished_at: '2026-07-06T10:01:00.000Z' },
  ], now)

  assert.equal(result.webhook_jobs.healthy, true)
  assert.equal(result.notification_digests.healthy, false)
  assert.equal(result.e2e_cleanup.healthy, false)
  assert.equal(result.account_deletions.healthy, false)
})
