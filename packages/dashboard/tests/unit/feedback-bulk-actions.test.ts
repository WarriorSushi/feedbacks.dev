import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('bulk feedback endpoint verifies ownership and returns authoritative changed rows', () => {
  const route = read('../../src/app/api/feedback/bulk/route.ts')

  assert.match(route, /auth\.getUser\(\)/)
  assert.match(route, /data\.length !== ids\.length/)
  assert.match(route, /Choose exactly one bulk action/)
  assert.match(route, /\.select\('id, project_id, status, tags, read_at, updated_at'\)/)
  assert.match(route, /body\.readState === 'read'/)
  assert.match(route, /cleanupFeedbackStorageForFeedbackIds\(admin, ids\)/)
  assert.match(route, /\.from\('feedback'\)\s*\.delete\(\)/)
})

test('inbox bulk toolbar exposes status, read state, tags, and confirmed deletion through the server endpoint', () => {
  const client = read('../../src/app/(dashboard)/feedback/feedback-inbox-client.tsx')

  assert.match(client, /fetch\('\/api\/feedback\/bulk'/)
  assert.match(client, /status: newStatus/)
  assert.match(client, /readState/)
  assert.match(client, /tag: \{ action, value: nextTag \}/)
  assert.match(client, /method: 'DELETE'/)
  assert.match(client, /Set closed/)
  assert.match(client, /Mark \{selectedHasUnread \? 'read' : 'unread'\}/)
  assert.match(client, /Permanently delete the selected feedback/)
})

test('feedback detail makes the signal prominent and permanent deletion explicit', () => {
  const page = read('../../src/app/(dashboard)/feedback/[id]/page.tsx')
  const actions = read('../../src/app/(dashboard)/feedback/[id]/feedback-actions.tsx')

  assert.match(page, /title="Review feedback"/)
  assert.match(page, /variant="secondary"/)
  assert.match(page, /User message/)
  assert.match(page, /Technical browser details/)
  assert.match(page, /formatFeedbackUrl/)
  assert.match(actions, /Delete this feedback permanently\?/)
  assert.match(actions, /router\.push\(inboxHref\)/)
})
