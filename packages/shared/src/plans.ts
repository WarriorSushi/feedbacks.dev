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
  webhookEndpointLimit: number | null
  webhookDeliveryLogLimit: number | null
  mcp: boolean
  emailAlerts: boolean
  customBranding: boolean
  productUpdates: boolean
  productUpdateActiveLimit: number | null
  productUpdateScheduling: boolean
  productUpdateAnalyticsDays: number
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
    projectLimit: 2,
    feedbackMonthlyLimit: 500,
    historyDays: null,
    apiAccess: true,
    publicBoards: true,
    webhooks: true,
    webhookEndpointLimit: 1,
    webhookDeliveryLogLimit: 10,
    mcp: true,
    emailAlerts: false,
    customBranding: false,
    productUpdates: true,
    productUpdateActiveLimit: 3,
    productUpdateScheduling: false,
    productUpdateAnalyticsDays: 7,
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
    webhookEndpointLimit: null,
    webhookDeliveryLogLimit: null,
    mcp: true,
    emailAlerts: true,
    customBranding: true,
    productUpdates: true,
    productUpdateActiveLimit: null,
    productUpdateScheduling: true,
    productUpdateAnalyticsDays: 90,
  },
}

export function getEntitlementsForPlan(planTier: PlanTier): EntitlementSet {
  return PLAN_MATRIX[planTier]
}

export function isFeatureEnabled(
  entitlements: EntitlementSet,
  feature: 'apiAccess' | 'publicBoards' | 'webhooks' | 'mcp' | 'emailAlerts' | 'customBranding' | 'productUpdates',
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
