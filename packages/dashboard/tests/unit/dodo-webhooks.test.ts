import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'
process.env.NEXT_PUBLIC_APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.feedbacks.dev'
process.env.DODO_PAYMENTS_WEBHOOK_SECRET = process.env.DODO_PAYMENTS_WEBHOOK_SECRET || 'whsec_test'

async function loadFixture(name: string) {
  const fixtureUrl = new URL(`../fixtures/dodo/${name}.json`, import.meta.url)
  const raw = await readFile(fixtureUrl, 'utf8')
  return JSON.parse(raw) as Record<string, unknown>
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

test('verifies valid Dodo webhook signatures', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)
  const webhookId = 'evt_test_valid'
  const timestamp = '1710000000'
  const signature = createHmac('sha256', process.env.DODO_PAYMENTS_WEBHOOK_SECRET!)
    .update(`${webhookId}.${timestamp}.${payload}`)
    .digest('hex')

  const request = new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': webhookId,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    },
    body: payload,
  })

  const verified = await verifyDodoWebhook(request)
  assert.equal(verified.webhookId, webhookId)
  assert.equal(verified.event.type, 'subscription.active')
})

test('rejects invalid Dodo webhook signatures', async () => {
  const { verifyDodoWebhook } = await import(new URL('../../src/lib/dodo.ts', import.meta.url).href)
  const fixture = await loadFixture('subscription-active')
  const payload = JSON.stringify(fixture)

  const request = new Request('https://example.com/api/billing/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'evt_test_invalid',
      'webhook-timestamp': '1710000001',
      'webhook-signature': 'bad-signature',
    },
    body: payload,
  })

  await assert.rejects(() => verifyDodoWebhook(request), /Invalid webhook signature/)
})
