import assert from 'node:assert/strict'
import test from 'node:test'
import { getOrCreateVoterDevice, getVoterIdentifier, VOTER_COOKIE } from '../../src/lib/voter-device.ts'

test('anonymous voting uses a stable signed device identifier', async () => {
  const secret = 'test-voter-secret-that-is-long-enough'
  const first = await getOrCreateVoterDevice(new Request('https://example.com'), secret)
  assert.equal(first.isNew, true)

  const returning = await getOrCreateVoterDevice(new Request('https://example.com', {
    headers: { cookie: `${VOTER_COOKIE.name}=${first.cookieValue}` },
  }), secret)
  assert.equal(returning.isNew, false)
  assert.equal(returning.id, first.id)
  assert.equal(
    await getVoterIdentifier(first.id, 'acme', secret),
    await getVoterIdentifier(returning.id, 'acme', secret),
  )
})

test('tampered voter cookies are replaced and board identities are scoped', async () => {
  const secret = 'test-voter-secret-that-is-long-enough'
  const first = await getOrCreateVoterDevice(new Request('https://example.com'), secret)
  const tampered = await getOrCreateVoterDevice(new Request('https://example.com', {
    headers: { cookie: `${VOTER_COOKIE.name}=${first.cookieValue}x` },
  }), secret)
  assert.equal(tampered.isNew, true)
  assert.notEqual(tampered.id, first.id)
  assert.notEqual(
    await getVoterIdentifier(first.id, 'acme', secret),
    await getVoterIdentifier(first.id, 'other-board', secret),
  )
})
