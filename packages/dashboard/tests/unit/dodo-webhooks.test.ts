import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'
process.env.NEXT_PUBLIC_APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.feedbacks.dev'
process.env.DODO_PAYMENTS_WEBHOOK_SECRET = process.env.DODO_PAYMENTS_WEBHOOK_SECRET || `whsec_${Buffer.from('test-secret').toString('base64')}`
process.env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID = 'prod_pro_monthly'
process.env.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID = 'prod_pro_yearly'

async function loadFixture(name: string) {
  const fixtureUrl = new URL(`../fixtures/dodo/${name}.json`, import.meta.url)
  const raw = await readFile(fixtureUrl, 'utf8')
  return JSON.parse(raw) as Record<string, unknown>
}

function createSignedDodoWebhookRequest({
  payload,
  webhookId = 'evt_test_valid',
  timestamp = Math.floor(Date.now() / 1000).toString(),
  signature = createHmac('sha256', process.env.DODO_PAYMENTS_WEBHOOK_SECRET!)
    .update(`${webhookId}.${timestamp}.${payload}`)
    .digest('hex'),
}: {
  payload: string
  webhookId?: string
  timestamp?: string
  signature?: string
}) {
  return new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': webhookId,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    },
    body: payload,
  })
}

function createStandardWebhookSignature(payload: string, webhookId: string, timestamp: string) {
  const digest = createHmac('sha256', process.env.DODO_PAYMENTS_WEBHOOK_SECRET!)
    .update(`${webhookId}.${timestamp}.${payload}`)
    .digest('base64')
  return `v1,${digest}`
}

function createDecodedStandardWebhookSignature(payload: string, webhookId: string, timestamp: string) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET!
  const encoded = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  const decodedSecret = Buffer.from(encoded, 'base64')
  const digest = createHmac('sha256', decodedSecret)
    .update(`${webhookId}.${timestamp}.${payload}`)
    .digest('base64')
  return `v1,${digest}`
}

test('maps subscription.active payloads to an active pro account', async () => {
  const { extractBillingEventContext } = await import(new URL('../../src/lib/billing-webhooks.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')

  const result = extractBillingEventContext(fixture)
  assert.equal(result.eventType, 'subscription.active')
  assert.equal(result.userId, '00000000-0000-0000-0000-000000000001')
  assert.equal(result.dodoCustomerId, 'cus_test_active')
  assert.equal(result.dodoSubscriptionId, 'sub_test_active')
  assert.equal(result.dodoProductId, 'prod_pro_monthly')
  assert.equal(result.billingStatus, 'active')
  assert.equal(result.planTier, 'pro')
  assert.equal(result.currentPeriodStart, '2026-03-01T00:00:00Z')
  assert.equal(result.currentPeriodEnd, '2026-04-01T00:00:00Z')
  assert.equal(result.cancelAtPeriodEnd, false)
})

test('maps subscription.updated payloads using the embedded subscription status', async () => {
  const { extractBillingEventContext } = await import(new URL('../../src/lib/billing-webhooks.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-updated-on-hold')

  const result = extractBillingEventContext(fixture)
  assert.equal(result.eventType, 'subscription.updated')
  assert.equal(result.billingStatus, 'on_hold')
  assert.equal(result.planTier, 'free')
  assert.equal(result.cancelAtPeriodEnd, true)
  assert.equal(result.dodoCustomerId, 'cus_test_hold')
})

test('maps payment.failed payloads to past_due for billing alerts', async () => {
  const { extractBillingEventContext } = await import(new URL('../../src/lib/billing-webhooks.ts', import.meta.url).href)
  const fixture = await loadFixture('payment-failed')

  const result = extractBillingEventContext(fixture)
  assert.equal(result.eventType, 'payment.failed')
  assert.equal(result.billingStatus, 'past_due')
  assert.equal(result.planTier, 'free')
  assert.equal(result.billingEmail, 'billing@example.com')
})

test('accepts only supported lifecycle events for configured Pro products', async () => {
  const { extractBillingEventContext, isSupportedBillingEvent } = await import(new URL('../../src/lib/billing-webhooks.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const allowedProducts = ['prod_pro_monthly', 'prod_pro_yearly']

  assert.equal(isSupportedBillingEvent(extractBillingEventContext(fixture), allowedProducts), true)
  assert.equal(isSupportedBillingEvent(extractBillingEventContext({
    ...fixture,
    type: 'customer.created',
  }), allowedProducts), false)
  assert.equal(isSupportedBillingEvent(extractBillingEventContext({
    ...fixture,
    data: { ...(fixture.data as Record<string, unknown>), product_id: 'prod_unrelated' },
  }), allowedProducts), false)
})

test('rejects billing events whose metadata conflicts with an existing provider binding', async () => {
  const { resolveBillingEventUser } = await import(new URL('../../src/lib/billing-webhooks.ts', import.meta.url).href)
  assert.deepEqual(resolveBillingEventUser('user-1', 'user-1', 'user-1'), { ok: true, userId: 'user-1' })
  assert.deepEqual(resolveBillingEventUser(null, 'user-1', null), { ok: true, userId: 'user-1' })
  assert.deepEqual(resolveBillingEventUser('user-1', 'user-2', null), { ok: false })
  assert.deepEqual(resolveBillingEventUser(null, 'user-1', 'user-2'), { ok: false })
})

test('verifies valid Dodo webhook signatures', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const request = createSignedDodoWebhookRequest({ payload })

  const verified = await verifyDodoWebhook(request)
  assert.equal(verified.webhookId, 'evt_test_valid')
  assert.equal(verified.event.type, 'subscription.active')
})

test('verifies Standard Webhooks v1 base64 Dodo signatures', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const webhookId = 'evt_test_standard'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId,
    timestamp,
    signature: createStandardWebhookSignature(payload, webhookId, timestamp),
  })

  const verified = await verifyDodoWebhook(request)
  assert.equal(verified.webhookId, webhookId)
  assert.equal(verified.event.type, 'subscription.active')
})

test('verifies Standard Webhooks signatures that use decoded whsec secrets', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const webhookId = 'evt_test_decoded_standard'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId,
    timestamp,
    signature: createDecodedStandardWebhookSignature(payload, webhookId, timestamp),
  })

  const verified = await verifyDodoWebhook(request)
  assert.equal(verified.webhookId, webhookId)
  assert.equal(verified.event.type, 'subscription.active')
})

test('verifies Dodo webhook signatures with millisecond timestamps', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId: 'evt_test_valid_ms',
    timestamp: Date.now().toString(),
  })

  const verified = await verifyDodoWebhook(request)
  assert.equal(verified.webhookId, 'evt_test_valid_ms')
})

test('rejects invalid Dodo webhook signatures', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)

  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId: 'evt_test_invalid',
    signature: 'bad-signature',
  })

  await assert.rejects(() => verifyDodoWebhook(request), /Invalid webhook signature/)
})

test('rejects stale Dodo webhook timestamps', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const staleTimestamp = Math.floor((Date.now() - 6 * 60 * 1000) / 1000).toString()
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId: 'evt_test_stale',
    timestamp: staleTimestamp,
  })

  await assert.rejects(() => verifyDodoWebhook(request), /timestamp is outside the allowed tolerance/)
})

test('rejects too-far-future Dodo webhook timestamps', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const futureTimestamp = Math.floor((Date.now() + 6 * 60 * 1000) / 1000).toString()
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId: 'evt_test_future',
    timestamp: futureTimestamp,
  })

  await assert.rejects(() => verifyDodoWebhook(request), /timestamp is outside the allowed tolerance/)
})

test('rejects malformed Dodo webhook timestamps', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const request = createSignedDodoWebhookRequest({
    payload,
    webhookId: 'evt_test_bad_timestamp',
    timestamp: 'not-a-timestamp',
  })

  await assert.rejects(() => verifyDodoWebhook(request), /Invalid Dodo webhook timestamp/)
})

test('rejects chunked Dodo webhooks before buffering an oversized payload', async () => {
  const { DODO_WEBHOOK_BODY_LIMIT, verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(DODO_WEBHOOK_BODY_LIMIT))
      controller.enqueue(new Uint8Array(1))
      controller.close()
    },
  })
  const request = new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'evt_oversized',
      'webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
      'webhook-signature': 'irrelevant',
    },
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })

  await assert.rejects(() => verifyDodoWebhook(request), /Request body exceeds/)
})
