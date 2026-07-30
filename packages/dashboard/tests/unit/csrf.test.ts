import assert from 'node:assert/strict'
import test from 'node:test'
import { isTrustedMutationOrigin, shouldEnforceCsrf } from '../../src/lib/csrf.ts'

test('enforces origin checks for cookie-authenticated mutation surfaces', () => {
  assert.equal(shouldEnforceCsrf('/api/projects/123', 'PATCH'), true)
  assert.equal(shouldEnforceCsrf('/api/account/delete', 'POST'), true)
  assert.equal(shouldEnforceCsrf('/api/projects/123', 'GET'), false)
})

test('keeps intentional cross-origin ingestion and provider routes available', () => {
  assert.equal(shouldEnforceCsrf('/api/feedback', 'POST'), false)
  assert.equal(shouldEnforceCsrf('/api/widget/updates/events', 'POST'), false)
  assert.equal(shouldEnforceCsrf('/api/v1/feedback', 'POST'), false)
  assert.equal(shouldEnforceCsrf('/api/webhooks/dodo', 'POST'), false)
})

test('accepts only exact app, request, or marketing origins', () => {
  const input = {
    requestOrigin: 'http://localhost:3000',
    appOrigin: 'https://app.feedbacks.dev',
    marketingOrigin: 'https://www.feedbacks.dev',
  }
  assert.equal(isTrustedMutationOrigin({ ...input, origin: 'https://app.feedbacks.dev' }), true)
  assert.equal(isTrustedMutationOrigin({ ...input, origin: 'https://www.feedbacks.dev' }), true)
  assert.equal(isTrustedMutationOrigin({ ...input, origin: 'https://app.feedbacks.dev.evil.test' }), false)
  assert.equal(isTrustedMutationOrigin({ ...input, origin: null }), false)
})
