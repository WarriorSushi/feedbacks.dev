import assert from 'node:assert/strict'
import test from 'node:test'
import { readJsonBody } from '../../src/lib/api-request.ts'

test('accepts a bounded JSON object', async () => {
  const result = await readJsonBody<{ message?: string }>(new Request('https://app.feedbacks.dev/api/example', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-request-id': 'request-1' },
    body: JSON.stringify({ message: 'hello' }),
  }))
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.data.message, 'hello')
})

test('rejects malformed JSON with a stable request id', async () => {
  const result = await readJsonBody(new Request('https://app.feedbacks.dev/api/example', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-request-id': 'request-2' },
    body: '{bad json',
  }))
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.response.status, 400)
    const payload = await result.response.json()
    assert.equal(payload.code, 'invalid_json')
    assert.equal(payload.requestId, 'request-2')
  }
})

test('rejects JSON over the route byte budget', async () => {
  const result = await readJsonBody(new Request('https://app.feedbacks.dev/api/example', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(100) }),
  }), { maxBytes: 32 })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.response.status, 413)
})

test('stops reading a chunked JSON body as soon as it crosses the byte budget', async () => {
  let pulls = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1
      controller.enqueue(new TextEncoder().encode('x'.repeat(12)))
      if (pulls >= 4) controller.close()
    },
  })
  const request = new Request('https://app.feedbacks.dev/api/example', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  const result = await readJsonBody(request, { maxBytes: 20 })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.response.status, 413)
  assert.equal(pulls, 2)
})
