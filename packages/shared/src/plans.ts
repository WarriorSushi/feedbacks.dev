export type PlanTier = 'free' | 'pro'

export type BillingStatus =
  | 'free'
  | 'pending'
  | 'active'
  | 'trialing'
  | 'on_hold'
  | 'past_due'
  | 'cancelled'
  | 'expired'

export type QuotaErrorCode =
  | 'project_limit_reached'
  | 'feedback_quota_reached'
  | 'history_window_exceeded'
  | 'feature_not_in_plan'

export interface EntitlementSet {
  planTier: PlanTier
  label: string
  monthlyPrice: number
  projectLimit: number | null
  feedbackMonthlyLimit: number | null
  historyDays: number | null
  apiAccess: boolean
  publicBoards: boolean
  webhooks: boolean
  mcp: boolean
  customBranding: boolean
}

export interface UsageSnapshot {
  projectCount: number
  feedbackThisMonth: number
  feedbackLimit: number | null
  historyDays: number | null
}

export const PLAN_MATRIX: Record<PlanTier, EntitlementSet> = {
  free: {
    planTier: 'free',
    label: 'Free',
    monthlyPrice: 0,
    projectLimit: 1,
    feedbackMonthlyLimit: 500,
    historyDays: 30,
    apiAccess: true,
    publicBoards: true,
    webhooks: false,
    mcp: false,
    customBranding: false,
  },
  pro: {
    planTier: 'pro',
    label: 'Pro',
    monthlyPrice: 19,
    projectLimit: null,
    feedbackMonthlyLimit: null,
    historyDays: null,
    apiAccess: true,
    publicBoards: true,
    webhooks: true,
    mcp: true,
    customBranding: true,
  },
}

export function getEntitlementsForPlan(planTier: PlanTier): EntitlementSet {
  return PLAN_MATRIX[planTier]
}

export function isFeatureEnabled(
  entitlements: EntitlementSet,
  feature: 'apiAccess' | 'publicBoards' | 'webhooks' | 'mcp' | 'customBranding',
): boolean {
  return entitlements[feature]
}

export function getHistoryWindowStart(
  entitlements: EntitlementSet,
  referenceDate: Date = new Date(),
): string | null {
  if (!entitlements.historyDays) return null
  const cutoff = new Date(referenceDate)
  cutoff.setDate(cutoff.getDate() - (entitlements.historyDays - 1))
  cutoff.setHours(0, 0, 0, 0)
  return cutoff.toISOString()
}
