import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  isBillingCheckoutAvailable,
  normalizeDodoPaymentsEnvironment,
  resolveBillingMode,
} from '../../src/lib/billing-mode.ts'

const configuredBilling = {
  apiKey: 'dodo_test_example',
  monthlyProductId: 'prod_test_monthly',
  webhookSecret: 'whsec_test',
} as const

test('normalizes Dodo SDK and short environment names', () => {
  assert.equal(normalizeDodoPaymentsEnvironment('test'), 'test')
  assert.equal(normalizeDodoPaymentsEnvironment('test_mode'), 'test')
  assert.equal(normalizeDodoPaymentsEnvironment('live'), 'live')
  assert.equal(normalizeDodoPaymentsEnvironment('live_mode'), 'live')
})

test('defaults missing or unknown environment values to the financially safe test mode', () => {
  assert.equal(normalizeDodoPaymentsEnvironment(undefined), 'test')
  assert.equal(normalizeDodoPaymentsEnvironment('unexpected'), 'test')
})

test('allows checkout for a complete Dodo test configuration', () => {
  const mode = resolveBillingMode({ environment: 'test', ...configuredBilling })

  assert.equal(mode, 'test')
  assert.equal(isBillingCheckoutAvailable(mode), true)
})

test('disables checkout when any required Dodo value is missing', () => {
  const mode = resolveBillingMode({
    environment: 'test',
    ...configuredBilling,
    webhookSecret: null,
  })

  assert.equal(mode, 'disabled')
  assert.equal(isBillingCheckoutAvailable(mode), false)
})

test('production checkout does not reject a configured Dodo test environment', async () => {
  const checkoutRoute = await readFile(
    new URL('../../src/app/api/billing/checkout/route.ts', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(checkoutRoute, /VERCEL_ENV/)
  assert.doesNotMatch(checkoutRoute, /billing_not_live/)
})
