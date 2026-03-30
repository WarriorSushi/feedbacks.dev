import type { BillingStatus, PlanTier } from '@feedbacks/shared'
import type { DodoEventPayload } from './dodo.ts'

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNestedString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const direct = readString(record[key])
    if (direct) return direct
  }
  return null
}

function readNestedObject(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function getEventData(event: DodoEventPayload) {
  return event.data && typeof event.data === 'object' && !Array.isArray(event.data)
    ? (event.data as Record<string, unknown>)
    : {}
}

export function getMetadata(data: Record<string, unknown>) {
  return readNestedObject(data, 'metadata') || {}
}

function normalizeSubscriptionStatus(status: string | null): BillingStatus | null {
  if (!status) return null

  switch (status) {
    case 'pending':
      return 'pending'
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'on_hold':
      return 'on_hold'
    case 'cancelled':
      return 'cancelled'
    case 'failed':
    case 'expired':
      return 'expired'
    default:
      return null
  }
}

export function resolveBillingStatus(eventType: string, data: Record<string, unknown>): BillingStatus | null {
  if (eventType === 'payment.failed') return 'past_due'

  const statusFromData = normalizeSubscriptionStatus(readNestedString(data, 'status'))
  if (statusFromData) return statusFromData

  if (eventType === 'subscription.active' || eventType === 'subscription.renewed') return 'active'
  if (eventType === 'subscription.on_hold') return 'on_hold'
  if (eventType === 'subscription.cancelled') return 'cancelled'
  if (eventType === 'subscription.failed' || eventType === 'subscription.expired') return 'expired'

  return null
}

export function resolvePlanTier(status: BillingStatus | null): PlanTier {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free'
}

function resolvePeriodValue(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

export interface BillingEventContext {
  eventType: string
  userId: string | null
  dodoCustomerId: string | null
  dodoSubscriptionId: string | null
  dodoProductId: string | null
  billingEmail: string | null
  billingStatus: BillingStatus | null
  planTier: PlanTier
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export function extractBillingEventContext(event: DodoEventPayload): BillingEventContext {
  const eventType = event.type || 'unknown'
  const data = getEventData(event)
  const metadata = getMetadata(data)
  const billingStatus = resolveBillingStatus(eventType, data)

  return {
    eventType,
    userId: readString(metadata.user_id),
    dodoCustomerId:
      readNestedString(data, 'customer_id', 'customerId') ||
      readNestedString(readNestedObject(data, 'customer') || {}, 'customer_id', 'customerId'),
    dodoSubscriptionId:
      readNestedString(data, 'subscription_id', 'subscriptionId') ||
      readNestedString(readNestedObject(data, 'subscription') || {}, 'subscription_id', 'subscriptionId'),
    dodoProductId:
      readNestedString(data, 'product_id', 'productId') ||
      readNestedString(readNestedObject(data, 'product') || {}, 'product_id', 'productId'),
    billingEmail:
      readNestedString(data, 'email') ||
      readNestedString(readNestedObject(data, 'customer') || {}, 'email'),
    billingStatus,
    planTier: resolvePlanTier(billingStatus),
    currentPeriodStart: resolvePeriodValue(
      data,
      'current_period_start',
      'period_start',
      'previous_billing_date',
      'starts_at',
    ),
    currentPeriodEnd: resolvePeriodValue(
      data,
      'current_period_end',
      'period_end',
      'next_billing_date',
      'ends_at',
      'expires_at',
    ),
    cancelAtPeriodEnd:
      data.cancel_at_period_end === true || data.cancel_at_next_billing_date === true,
  }
}
