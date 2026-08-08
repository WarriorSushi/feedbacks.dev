import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('feedback inbox server-loads its first page while independent reads run concurrently', () => {
  const page = read('../../src/app/(dashboard)/feedback/page.tsx')

  assert.doesNotMatch(page, /['"]use client['"]/)
  assert.match(page, /const projectsPromise = supabase/)
  assert.match(page, /const billingPromise = getCurrentUserBillingSummary\(\)/)
  assert.match(page, /Promise\.all\(\[\s*projectsPromise,\s*billingPromise,\s*earlyFeedbackPromise,/)
  assert.match(page, /queryFeedbackInbox\(/)
  assert.match(page, /initialFeedbacks=\{initialFeedback\.feedbacks\}/)
  assert.match(page, /initialHistoryCutoff=\{historyCutoff\}/)
})

test('feedback inbox hydrates without repeating the server query or billing request', () => {
  const client = read('../../src/app/(dashboard)/feedback/feedback-inbox-client.tsx')

  assert.match(client, /useState<Feedback\[]>\(initialFeedbacks\)/)
  assert.match(client, /useRef\(initialQueryKey\)/)
  assert.match(client, /if \(lastLoadedQueryKeyRef\.current === queryKey\) return/)
  assert.match(client, /const historyCutoff = initialHistoryCutoff/)
  assert.doesNotMatch(client, /getFeedbackHistoryCutoff/)
  assert.doesNotMatch(client, /\/api\/billing\/sync/)
  assert.doesNotMatch(client, /\.from\(['"]projects['"]\)/)
})

test('feedback inbox keeps project scope out of the empty-search filter state and preserves detail return context', () => {
  const client = read('../../src/app/(dashboard)/feedback/feedback-inbox-client.tsx')
  const rows = read('../../src/app/(dashboard)/feedback/feedback-inbox-components.tsx')

  assert.match(client, /const hasFilters = status \|\| type \|\| search \|\| agent \|\| publicOnly \|\| priority \|\| tag \|\| read === 'unread'/)
  assert.match(client, /const returnTo = `\/feedback/)
  assert.match(client, /returnTo=\{returnTo\}/)
  assert.match(client, /router\.push\(`\/feedback\/\$\{activeRowId\}\?returnTo=\$\{encodeURIComponent\(returnTo\)\}`\)/)
  assert.match(rows, /fb\.priority === ["']high["'] \|\| fb\.priority === ["']critical["']/)
})
