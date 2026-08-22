import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyCaptchaToken } from '../../src/lib/captcha.ts'

test('hCaptcha verification binds the token to the configured site and visitor IP', async () => {
  const originalFetch = globalThis.fetch
  let submittedBody = ''
  globalThis.fetch = async (_input, init) => {
    submittedBody = String(init?.body)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    const result = await verifyCaptchaToken({
      provider: 'hcaptcha',
      token: 'one-time-token',
      secretKey: 'server-secret',
      siteKey: 'expected-site-key',
      remoteIp: '203.0.113.10',
    })

    assert.deepEqual(result, { ok: true })
    const body = new URLSearchParams(submittedBody)
    assert.equal(body.get('response'), 'one-time-token')
    assert.equal(body.get('sitekey'), 'expected-site-key')
    assert.equal(body.get('remoteip'), '203.0.113.10')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Turnstile verification rejects a valid token issued for a different action', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    action: 'different_action',
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

  try {
    const result = await verifyCaptchaToken({
      provider: 'turnstile',
      token: 'one-time-token',
      secretKey: 'server-secret',
      expectedAction: 'early_adopter_claim',
    })
    assert.deepEqual(result, { ok: false, reason: 'invalid_token' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('CAPTCHA verification fails closed before the network when its server secret is missing', async () => {
  const originalFetch = globalThis.fetch
  let called = false
  globalThis.fetch = async () => {
    called = true
    return new Response(JSON.stringify({ success: true }))
  }

  try {
    const result = await verifyCaptchaToken({
      provider: 'hcaptcha',
      token: 'one-time-token',
      secretKey: null,
    })
    assert.deepEqual(result, { ok: false, reason: 'misconfigured' })
    assert.equal(called, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})
