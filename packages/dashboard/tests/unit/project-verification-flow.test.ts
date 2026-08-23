import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('real product verification polls only authenticated project feedback after the session starts', () => {
  const route = read('../../src/app/api/projects/[id]/verification-status/route.ts')
  const client = read('../../src/app/(dashboard)/projects/[id]/project-verify-client.tsx')

  assert.match(route, /getAuthedUserAndProject\(id\)/)
  assert.match(route, /\.eq\('project_id', id\)/)
  assert.match(route, /\.gte\('created_at', boundedSince\)/)
  assert.match(route, /\.select\('id, created_at, url, metadata'\)/)
  assert.match(route, /HOSTED_VERIFICATION_SUBMISSION_CONTEXT/)
  assert.match(route, /metadata\?\.submission_context !== HOSTED_VERIFICATION_SUBMISSION_CONTEXT/)
  assert.doesNotMatch(route, /\.not\('url', 'ilike'/)
  assert.doesNotMatch(route, /message/)
  assert.match(client, /verification-status\?since=/)
  assert.match(client, /setInterval\(\(\) => void checkForProductFeedback\(\), 4000\)/)
  assert.match(client, /Test feedback arrived from your product/)
})

test('first connection guides users from installation through customization', () => {
  const progress = read('../../src/app/(dashboard)/projects/[id]/project-flow-nav.tsx')
  const verify = read('../../src/app/(dashboard)/projects/[id]/project-verify-client.tsx')

  for (const label of ['Install', 'Test', 'Inbox', 'Customize']) {
    assert.match(progress, new RegExp(`label: '${label}'`))
  }
  assert.match(verify, /Customize feedback form/)
  assert.match(verify, /Troubleshooting: test the saved form here/)
  assert.match(verify, /fixed to the \$\{launcherPosition\} of this page/)
})

test('hosted control submissions are tagged without excluding real feedbacks.dev submissions', () => {
  const shared = read('../../../shared/src/widget-install.ts')
  const widget = read('../../../widget/src/widget.ts')
  const preview = read('../../src/app/(dashboard)/projects/[id]/widget-preview-surface.tsx')
  const feedbackRoute = read('../../src/app/api/feedback/route.ts')
  const verify = read('../../src/app/(dashboard)/projects/[id]/project-verify-client.tsx')

  assert.match(shared, /HOSTED_VERIFICATION_SUBMISSION_CONTEXT = 'hosted-verification'/)
  assert.match(widget, /submissionContext: this\.cfg\.submissionContext/)
  assert.match(preview, /submissionContext: HOSTED_VERIFICATION_SUBMISSION_CONTEXT/)
  assert.match(feedbackRoute, /submission_context: submissionContext/)
  assert.match(verify, /detail\.submissionContext === HOSTED_VERIFICATION_SUBMISSION_CONTEXT/)
  assert.doesNotMatch(verify, /feedback\.url\?\.includes/)
})

test('sidebar polls an authenticated project unread count and renders a compact badge', () => {
  const sidebar = read('../../src/components/sidebar.tsx')
  const route = read('../../src/app/api/projects/[id]/unread-count/route.ts')

  assert.match(route, /getAuthedUserAndProject\(id\)/)
  assert.match(route, /\.select\('id', \{ count: 'exact', head: true \}\)/)
  assert.match(route, /\.eq\('project_id', id\)/)
  assert.match(route, /\.eq\('is_archived', false\)/)
  assert.match(route, /\.is\('read_at', null\)/)
  assert.match(sidebar, /\/unread-count/)
  assert.match(sidebar, /setInterval\(refreshWhenVisible, 5000\)/)
  assert.match(sidebar, /feedbacks:submitted/)
  assert.match(sidebar, /99\+/)
  assert.match(sidebar, /bg-foreground/)
})
