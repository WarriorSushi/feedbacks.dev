import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('bulk feedback endpoint verifies ownership and tolerates stale selections', () => {
  const route = read('../../src/app/api/feedback/bulk/route.ts')

  assert.match(route, /auth\.getUser\(\)/)
  assert.doesNotMatch(route, /data\.length !== ids\.length/)
  assert.match(route, /skippedCount/)
  assert.match(route, /Deletion is intentionally idempotent/)
  assert.match(route, /Choose exactly one bulk action/)
  assert.match(route, /\.select\('id, project_id, status, tags, read_at, updated_at'\)/)
  assert.match(route, /body\.readState === 'read'/)
  assert.match(route, /cleanupFeedbackStorageForFeedbackIds\(admin, targetIds\)/)
  assert.match(route, /\.from\('feedback'\)\s*\.delete\(\)/)
})

test('inbox bulk toolbar exposes status, read state, tags, and confirmed deletion through the server endpoint', () => {
  const client = read('../../src/app/(dashboard)/feedback/feedback-inbox-client.tsx')

  assert.match(client, /fetch\('\/api\/feedback\/bulk'/)
  assert.match(client, /status: newStatus/)
  assert.match(client, /readState/)
  assert.match(client, /tag: \{ action, value: nextTag \}/)
  assert.match(client, /requestBulkChange\(\s*'DELETE'/)
  assert.match(client, /Set closed/)
  assert.match(client, /Mark \{selectedHasUnread \? 'read' : 'unread'\}/)
  assert.match(client, /Permanently delete the selected feedback/)
  assert.match(client, /requestBulkChange/)
  assert.match(client, /lastSyncedAtRef/)
  assert.match(client, /latestFetchRef/)
  assert.match(client, /data-toast-clearance/)
})

test('toast viewport clears fixed action bars instead of covering them', () => {
  const toaster = read('../../src/components/toaster.tsx')
  const updates = read('../../src/components/product-updates/ProductUpdatesTab.tsx')

  assert.match(toaster, /querySelectorAll<HTMLElement>\('\[data-toast-clearance\]'\)/)
  assert.match(toaster, /viewportHeight - rect\.top \+ 12/)
  assert.match(toaster, /data-toast-viewport/)
  assert.match(updates, /data-toast-clearance/)
})

test('feedback detail makes the signal prominent and permanent deletion explicit', () => {
  const page = read('../../src/app/(dashboard)/feedback/[id]/page.tsx')
  const actions = read('../../src/app/(dashboard)/feedback/[id]/feedback-actions.tsx')

  assert.match(page, /title="Review feedback"/)
  assert.match(page, /variant="secondary"/)
  assert.match(page, /User message/)
  assert.match(page, /summarizeUserAgent/)
  assert.match(page, /View technical details/)
  assert.match(page, /Screenshot capture/)
  assert.match(page, /formatFeedbackUrl/)
  assert.match(actions, /Delete this feedback permanently\?/)
  assert.match(actions, /router\.push\(inboxHref\)/)
})
