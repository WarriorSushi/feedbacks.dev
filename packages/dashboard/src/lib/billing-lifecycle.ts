import { PLAN_MATRIX, type BillingStatus } from '@feedbacks/shared'
import { createAdminSupabase } from '@/lib/supabase-server'
import { notifyUserOfDowngradeGrace } from '@/lib/notifications'
import { qualifyReferralSignup } from '@/lib/referrals'

const WARNING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

function validDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function applyBillingLifecycleEvent(input: {
  userId: string
  billingStatus: BillingStatus | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd?: string | null
}) {
  const admin = await createAdminSupabase()
  const paid = input.billingStatus === 'active' || input.billingStatus === 'trialing'
  const now = new Date()
  const periodEnd = validDate(input.currentPeriodEnd)
  const { data: account, error: accountError } = await admin
    .from('billing_accounts')
    .select('complimentary_pro_until,grace_ends_at,grace_cycle_id')
    .eq('user_id', input.userId)
    .maybeSingle()
  if (accountError) throw accountError
  const complimentaryEnd = validDate(account?.complimentary_pro_until)
  const complimentaryStillActive = Boolean(complimentaryEnd && complimentaryEnd.getTime() > now.getTime())
  const scheduledCancellationStillPaid = input.cancelAtPeriodEnd &&
    (paid || input.billingStatus === 'cancelled') &&
    Boolean(periodEnd && periodEnd.getTime() > now.getTime())
  const paidThroughPeriodEnd = paid || scheduledCancellationStillPaid || complimentaryStillActive
  const accessEnd = scheduledCancellationStillPaid && periodEnd
    ? new Date(Math.max(periodEnd.getTime(), complimentaryEnd?.getTime() || 0))
    : !paid && complimentaryStillActive
      ? complimentaryEnd
      : null

  if (paidThroughPeriodEnd) {
    if (accessEnd) {
      const sameCancellation = account?.grace_cycle_id &&
        validDate(account.grace_ends_at)?.getTime() === accessEnd.getTime()
      const warningStart = new Date(Math.max(now.getTime(), accessEnd.getTime() - WARNING_WINDOW_MS))
      const { error: scheduleError } = await admin
        .from('billing_accounts')
        .update({
          grace_started_at: warningStart.toISOString(),
          grace_ends_at: accessEnd.toISOString(),
          grace_cycle_id: sameCancellation ? account.grace_cycle_id : crypto.randomUUID(),
          downgrade_finalized_at: null,
        })
        .eq('user_id', input.userId)
      if (scheduleError) throw scheduleError
    } else {
      const { error: clearError } = await admin
        .from('billing_accounts')
        .update({
          grace_started_at: null,
          grace_ends_at: null,
          grace_cycle_id: null,
          downgrade_finalized_at: null,
        })
        .eq('user_id', input.userId)
      if (clearError) throw clearError
    }

    const { error: reconcileError } = await admin.rpc('reconcile_plan_projects', {
      p_user_id: input.userId,
      p_effective_pro: true,
      p_free_project_limit: PLAN_MATRIX.free.projectLimit || 2,
    })
    if (reconcileError) throw reconcileError
    return
  }

  if (!input.billingStatus || input.billingStatus === 'free' || input.billingStatus === 'pending') return

  const { error: reconcileError } = await admin.rpc('reconcile_plan_projects', {
    p_user_id: input.userId,
    p_effective_pro: false,
    p_free_project_limit: PLAN_MATRIX.free.projectLimit || 2,
  })
  if (reconcileError) throw reconcileError

  const { error: finalizeError } = await admin
    .from('billing_accounts')
    .update({
      plan_tier: 'free',
      complimentary_pro_until: complimentaryEnd && complimentaryEnd.getTime() <= now.getTime() ? null : account?.complimentary_pro_until,
      grace_started_at: null,
      grace_ends_at: null,
      grace_cycle_id: null,
      downgrade_finalized_at: now.toISOString(),
    })
    .eq('user_id', input.userId)
  if (finalizeError) throw finalizeError
}

export async function processBillingLifecycle() {
  const admin = await createAdminSupabase()
  const now = new Date()
  const { data: accounts, error } = await admin
    .from('billing_accounts')
    .select('user_id,billing_email,billing_status,cancel_at_period_end,current_period_end,complimentary_pro_until,grace_started_at,grace_ends_at,grace_cycle_id,downgrade_finalized_at')
    .or('grace_ends_at.not.is.null,complimentary_pro_until.not.is.null')
  if (error) throw error

  let noticesSent = 0
  let downgraded = 0
  for (const account of accounts || []) {
    const startsAt = validDate(account.grace_started_at)
    const endsAt = validDate(account.grace_ends_at)
    const currentPeriodEnd = validDate(account.current_period_end)
    const complimentaryEnd = validDate(account.complimentary_pro_until)
    const basePaid = (account.billing_status === 'active' || account.billing_status === 'trialing') && !(
      account.cancel_at_period_end && currentPeriodEnd && currentPeriodEnd.getTime() <= now.getTime()
    )
    const complimentaryActive = Boolean(complimentaryEnd && complimentaryEnd.getTime() > now.getTime())

    if (!startsAt || !endsAt || !account.grace_cycle_id) {
      if (complimentaryEnd && complimentaryEnd.getTime() <= now.getTime()) {
        if (!basePaid) {
          const { error: reconcileError } = await admin.rpc('reconcile_plan_projects', {
            p_user_id: account.user_id,
            p_effective_pro: false,
            p_free_project_limit: PLAN_MATRIX.free.projectLimit || 2,
          })
          if (reconcileError) throw reconcileError
          downgraded += 1
        }
        const { error: expiryError } = await admin
          .from('billing_accounts')
          .update({
            complimentary_pro_until: null,
            ...(basePaid ? {} : { plan_tier: 'free', downgrade_finalized_at: now.toISOString() }),
          })
          .eq('user_id', account.user_id)
        if (expiryError) throw expiryError
      }
      continue
    }

    if (now.getTime() >= endsAt.getTime()) {
      if (basePaid) {
        const { error: reconcileError } = await admin.rpc('reconcile_plan_projects', {
          p_user_id: account.user_id,
          p_effective_pro: true,
          p_free_project_limit: PLAN_MATRIX.free.projectLimit || 2,
        })
        if (reconcileError) throw reconcileError
        const { error: clearError } = await admin
          .from('billing_accounts')
          .update({
            grace_started_at: null,
            grace_ends_at: null,
            grace_cycle_id: null,
            complimentary_pro_until: complimentaryEnd && complimentaryEnd.getTime() <= now.getTime()
              ? null
              : account.complimentary_pro_until,
            downgrade_finalized_at: null,
          })
          .eq('user_id', account.user_id)
        if (clearError) throw clearError
        continue
      }
      if (complimentaryActive && complimentaryEnd) {
        const { error: extendError } = await admin
          .from('billing_accounts')
          .update({
            grace_started_at: new Date(Math.max(now.getTime(), complimentaryEnd.getTime() - WARNING_WINDOW_MS)).toISOString(),
            grace_ends_at: complimentaryEnd.toISOString(),
            grace_cycle_id: crypto.randomUUID(),
            downgrade_finalized_at: null,
          })
          .eq('user_id', account.user_id)
        if (extendError) throw extendError
        continue
      }
      if (!account.downgrade_finalized_at) {
        const { error: reconcileError } = await admin.rpc('reconcile_plan_projects', {
          p_user_id: account.user_id,
          p_effective_pro: false,
          p_free_project_limit: PLAN_MATRIX.free.projectLimit || 2,
        })
        if (reconcileError) throw reconcileError
        const { error: finalizeError } = await admin
          .from('billing_accounts')
          .update({
            plan_tier: 'free',
            complimentary_pro_until: complimentaryEnd ? null : account.complimentary_pro_until,
            downgrade_finalized_at: now.toISOString(),
          })
          .eq('user_id', account.user_id)
          .eq('grace_cycle_id', account.grace_cycle_id)
        if (finalizeError) throw finalizeError
        downgraded += 1
      }
      continue
    }
    if (now.getTime() < startsAt.getTime()) continue

    const noticeDay = Math.min(3, Math.floor((now.getTime() - startsAt.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    const { error: noticeClaimError } = await admin.from('billing_lifecycle_notices').insert({
      user_id: account.user_id,
      grace_cycle_id: account.grace_cycle_id,
      notice_day: noticeDay,
    })
    if (noticeClaimError?.code === '23505') continue
    if (noticeClaimError) throw noticeClaimError

    const sent = await notifyUserOfDowngradeGrace({
      userId: account.user_id,
      billingEmail: account.billing_email,
      day: noticeDay as 1 | 2 | 3,
      graceEndsAt: endsAt.toISOString(),
      freeProjectLimit: PLAN_MATRIX.free.projectLimit || 2,
    })
    if (sent) noticesSent += 1
    else {
      await admin
        .from('billing_lifecycle_notices')
        .delete()
        .eq('user_id', account.user_id)
        .eq('grace_cycle_id', account.grace_cycle_id)
        .eq('notice_day', noticeDay)
    }
  }

  const { data: pendingReferrals, error: referralError } = await admin
    .from('referral_signups')
    .select('invited_user_id')
    .eq('status', 'pending')
    .lte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .limit(250)
  if (referralError) throw referralError
  let referralsQualified = 0
  for (const referral of pendingReferrals || []) {
    const result = await qualifyReferralSignup(referral.invited_user_id) as { qualified?: boolean } | null
    if (result?.qualified) referralsQualified += 1
  }

  const signalCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const [acquisitionPrune, referralPrune] = await Promise.all([
    admin
      .from('user_acquisition')
      .update({ network_hash: null, device_hash: null }, { count: 'exact' })
      .lt('created_at', signalCutoff)
      .or('network_hash.not.is.null,device_hash.not.is.null'),
    admin
      .from('referral_signups')
      .update({ network_hash: null, device_hash: null }, { count: 'exact' })
      .lt('created_at', signalCutoff)
      .neq('status', 'pending')
      .or('network_hash.not.is.null,device_hash.not.is.null'),
  ])
  if (acquisitionPrune.error) throw acquisitionPrune.error
  if (referralPrune.error) throw referralPrune.error

  return {
    processed: accounts?.length || 0,
    noticesSent,
    downgraded,
    referralsQualified,
    signalsPruned: (acquisitionPrune.count || 0) + (referralPrune.count || 0),
  }
}
