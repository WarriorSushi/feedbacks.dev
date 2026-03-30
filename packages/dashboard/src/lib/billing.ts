import { getEntitlementsForPlan, getHistoryWindowStart, isFeatureEnabled, type BillingStatus, type EntitlementSet, type PlanTier, type UsageSnapshot } from '@feedbacks/shared'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { env, isBillingEnabled } from '@/lib/env'
import type { BillingAccount, BillingSummary } from '@/lib/types'

const FEEDBACK_USAGE_METRIC = 'feedback_submissions'

const BILLING_STATUS_TO_PLAN: Record<BillingStatus, PlanTier> = {
  free: 'free',
  pending: 'free',
  active: 'pro',
  trialing: 'pro',
  on_hold: 'free',
  past_due: 'free',
  cancelled: 'free',
  expired: 'free',
}

function startOfCurrentMonth(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

function defaultBillingAccount(userId: string, email?: string | null): BillingAccount {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    plan_tier: 'free',
    billing_status: 'free',
    dodo_customer_id: null,
    dodo_subscription_id: null,
    dodo_product_id: null,
    billing_email: email || null,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    last_event_id: null,
    last_event_type: null,
    created_at: now,
    updated_at: now,
  }
}

export function resolvePlanTier(account: Pick<BillingAccount, 'plan_tier' | 'billing_status'> | null): PlanTier {
  if (!account) return 'free'
  const statusPlan = BILLING_STATUS_TO_PLAN[account.billing_status]
  if (statusPlan === 'pro' && account.plan_tier === 'pro') return 'pro'
  return account.plan_tier === 'pro' && statusPlan === 'pro' ? 'pro' : statusPlan
}

export async function getOrCreateBillingAccount(userId: string, email?: string | null) {
  const admin = await createAdminSupabase()
  const { data: existing } = await admin
    .from('billing_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return existing as BillingAccount
  }

  const seed = defaultBillingAccount(userId, email)
  const { data } = await admin
    .from('billing_accounts')
    .insert(seed)
    .select('*')
    .single()

  return (data as BillingAccount | null) || seed
}

export async function getUsageSnapshot(userId: string, entitlements: EntitlementSet): Promise<UsageSnapshot> {
  const admin = await createAdminSupabase()
  const monthStart = startOfCurrentMonth()

  const [{ count: projectCount }, { data: usageRow }] = await Promise.all([
    admin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', userId),
    admin
      .from('usage_counters')
      .select('count')
      .eq('user_id', userId)
      .eq('metric', FEEDBACK_USAGE_METRIC)
      .eq('period_start', monthStart)
      .maybeSingle(),
  ])

  return {
    projectCount: projectCount ?? 0,
    feedbackThisMonth: usageRow?.count ?? 0,
    feedbackLimit: entitlements.feedbackMonthlyLimit,
    historyDays: entitlements.historyDays,
  }
}

export async function getBillingSummaryForUser(userId: string, email?: string | null): Promise<BillingSummary> {
  const account = await getOrCreateBillingAccount(userId, email)
  const entitlements = getEntitlementsForPlan(resolvePlanTier(account))
  const usage = await getUsageSnapshot(userId, entitlements)

  return {
    account,
    entitlements,
    usage,
    billingEnabled: isBillingEnabled(),
  }
}

export async function getCurrentUserBillingSummary() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return getBillingSummaryForUser(user.id, user.email)
}

export async function incrementFeedbackUsage(userId: string) {
  const admin = await createAdminSupabase()
  const { error } = await admin.rpc('increment_usage_counter', {
    p_user_id: userId,
    p_metric: FEEDBACK_USAGE_METRIC,
    p_period_start: startOfCurrentMonth(),
    p_amount: 1,
  })

  if (error) {
    console.error('Failed to increment usage counter', error)
  }
}

export async function assertCanCreateProject(userId: string, email?: string | null) {
  const summary = await getBillingSummaryForUser(userId, email)
  if (summary.entitlements.projectLimit && summary.usage.projectCount >= summary.entitlements.projectLimit) {
    return {
      allowed: false as const,
      summary,
      code: 'project_limit_reached' as const,
      message: 'Free plan includes 1 project. Upgrade to Pro to create more projects.',
    }
  }

  return { allowed: true as const, summary }
}

export async function assertCanReceiveFeedback(userId: string, email?: string | null) {
  const summary = await getBillingSummaryForUser(userId, email)
  if (
    summary.entitlements.feedbackMonthlyLimit &&
    summary.usage.feedbackThisMonth >= summary.entitlements.feedbackMonthlyLimit
  ) {
    return {
      allowed: false as const,
      summary,
      code: 'feedback_quota_reached' as const,
      message: 'This project has reached its monthly feedback limit. Upgrade to Pro to continue collecting feedback.',
    }
  }

  return { allowed: true as const, summary }
}

export async function assertFeatureAccess(
  userId: string,
  feature: 'apiAccess' | 'publicBoards' | 'webhooks' | 'mcp' | 'customBranding',
  email?: string | null,
) {
  const summary = await getBillingSummaryForUser(userId, email)
  if (!isFeatureEnabled(summary.entitlements, feature)) {
    return {
      allowed: false as const,
      summary,
      code: 'feature_not_in_plan' as const,
      message: `Your ${summary.entitlements.label} plan does not include this feature.`,
    }
  }

  return { allowed: true as const, summary }
}

export function getHistoryCutoff(summary: BillingSummary): string | null {
  return getHistoryWindowStart(summary.entitlements)
}

export function getProMonthlyProductId() {
  return env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID
}
