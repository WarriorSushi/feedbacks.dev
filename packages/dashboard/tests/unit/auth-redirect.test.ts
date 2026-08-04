import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldProbeAppSession } from '../../src/lib/auth-redirect.ts'

test('local marketing builds never probe the hosted production session', () => {
  assert.equal(shouldProbeAppSession('http://127.0.0.1:3000', 'https://app.feedbacks.dev'), false)
  assert.equal(shouldProbeAppSession('http://localhost:3000', 'https://app.feedbacks.dev'), false)
})

test('production and same-machine development session probes remain enabled', () => {
  assert.equal(shouldProbeAppSession('https://www.feedbacks.dev', 'https://app.feedbacks.dev'), true)
  assert.equal(shouldProbeAppSession('http://localhost:3000', 'http://localhost:3001'), true)
})

test('malformed and insecure remote origins fail closed', () => {
  assert.equal(shouldProbeAppSession('not-an-origin', 'https://app.feedbacks.dev'), false)
  assert.equal(shouldProbeAppSession('http://preview.example.com', 'https://app.feedbacks.dev'), false)
})
