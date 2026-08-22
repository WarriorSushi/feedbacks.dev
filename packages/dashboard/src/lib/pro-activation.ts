import type { BillingStatus, PlanTier } from '@feedbacks/shared'

export const PRO_ACTIVATED_EVENT = 'feedbacks:pro-activated'
export const PRO_CELEBRATION_STARTED_EVENT = 'feedbacks:pro-celebration-started'
export const PRO_CELEBRATION_COMPLETE_EVENT = 'feedbacks:pro-celebration-complete'

export interface ProAccountSnapshot {
  plan_tier?: PlanTier | null
  billing_status?: BillingStatus | null
  complimentary_pro_until?: string | null
  grace_ends_at?: string | null
  current_period_start?: string | null
  last_event_at?: string | null
  updated_at?: string | null
}

function isFuture(value: string | null | undefined, now: number) {
  return Boolean(value && new Date(value).getTime() > now)
}

export function hasActivePro(account: ProAccountSnapshot | null | undefined, now = Date.now()) {
  if (!account) return false
  return Boolean(
    (account.plan_tier === 'pro' && ['active', 'trialing'].includes(account.billing_status || ''))
    || isFuture(account.complimentary_pro_until, now)
    || isFuture(account.grace_ends_at, now),
  )
}

export function getProActivationKey(account: ProAccountSnapshot | null | undefined, now = Date.now()) {
  if (!account || !hasActivePro(account, now)) return null
  return [
    account.plan_tier === 'pro' ? 'paid' : 'complimentary',
    account.current_period_start || account.complimentary_pro_until || account.grace_ends_at || 'active',
    account.last_event_at || account.updated_at || 'unknown',
  ].join(':')
}

export function announceProActivation(activationKey?: string | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PRO_ACTIVATED_EVENT, {
    detail: { activationKey: activationKey || `pro:${Date.now()}` },
  }))
}
