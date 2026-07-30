import assert from 'node:assert/strict'
import test from 'node:test'
import { apiV1Error } from '../../src/lib/api-v1-response.ts'

test('v1 errors expose a safe stable envelope and request correlation id', async () => {
  const response = apiV1Error('Try again later.', 503, { 'Retry-After': '2' })
  const body = await response.json()
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('retry-after'), '2')
  assert.equal(body.code, 'service_unavailable')
  assert.equal(body.message, 'Try again later.')
  assert.equal(body.error, body.message)
  assert.equal(body.requestId, response.headers.get('x-request-id'))
})
