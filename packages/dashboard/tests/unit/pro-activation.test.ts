import assert from 'node:assert/strict'
import test from 'node:test'

import { getProActivationKey, hasActivePro } from '../../src/lib/pro-activation.ts'

const now = new Date('2026-08-22T12:00:00.000Z').getTime()

test('paid, complimentary, and grace access all count as active Pro', () => {
  assert.equal(hasActivePro({ plan_tier: 'pro', billing_status: 'active' }, now), true)
  assert.equal(hasActivePro({ complimentary_pro_until: '2026-09-22T12:00:00.000Z' }, now), true)
  assert.equal(hasActivePro({ grace_ends_at: '2026-08-23T12:00:00.000Z' }, now), true)
  assert.equal(hasActivePro({ plan_tier: 'free', billing_status: 'free' }, now), false)
})

test('the activation key changes when a new Pro entitlement is issued', () => {
  const first = getProActivationKey({
    complimentary_pro_until: '2026-09-22T12:00:00.000Z',
    updated_at: '2026-08-22T12:00:00.000Z',
  }, now)
  const renewed = getProActivationKey({
    complimentary_pro_until: '2026-10-22T12:00:00.000Z',
    updated_at: '2026-09-22T12:00:00.000Z',
  }, now)

  assert.ok(first)
  assert.ok(renewed)
  assert.notEqual(first, renewed)
})
