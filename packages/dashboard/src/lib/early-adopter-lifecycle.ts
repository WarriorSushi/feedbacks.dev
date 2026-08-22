import { createAdminSupabase } from '@/lib/supabase-server'
import { notifyEarlyAdopterLifecycle, type EarlyAdopterNoticeType } from '@/lib/notifications'
import type { EarlyAdopterMembership } from '@/lib/early-adopter'

const DAY_MS = 24 * 60 * 60 * 1000

function addUtcMonths(value: string, months: number) {
  const date = new Date(value)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date
}

export async function processEarlyAdopterLifecycle(now = new Date()) {
  const admin = await createAdminSupabase()
  const { data, error } = await admin
    .from('early_adopter_memberships')
    .select('*')
    .in('status', ['active', 'grace', 'finishing'])
    .order('updated_at', { ascending: true })
  if (error) throw new Error(error.message)

  let transitioned = 0
  let noticesSent = 0

  const sendOnce = async (membership: EarlyAdopterMembership, noticeType: EarlyAdopterNoticeType) => {
    const cycle = Math.max(1, Math.min(12, membership.pro_months_earned))
    const { data: claimed, error: claimError } = await admin
      .from('early_adopter_notices')
      .insert({ membership_id: membership.id, cycle_number: cycle, notice_type: noticeType })
      .select('id')
      .maybeSingle()
    if (claimError?.code === '23505') return false
    if (claimError || !claimed) return false

    const sent = await notifyEarlyAdopterLifecycle({
      email: membership.email,
      noticeType,
      proMonthsEarned: membership.pro_months_earned,
      feedbackDueAt: membership.feedback_due_at,
      graceEndsAt: membership.grace_ends_at,
      programmeEndsAt: membership.programme_ends_at,
    })
    if (!sent) {
      await admin.from('early_adopter_notices').delete().eq('id', claimed.id)
      return false
    }
    noticesSent += 1
    return true
  }

  for (const row of (data || []) as EarlyAdopterMembership[]) {
    let membership = row
    const nowTime = now.getTime()

    if (membership.status === 'finishing' && membership.programme_ends_at && new Date(membership.programme_ends_at).getTime() <= nowTime) {
      const { data: updated } = await admin
        .from('early_adopter_memberships')
        .update({ status: 'completed', completed_at: now.toISOString() })
        .eq('id', membership.id)
        .eq('status', 'finishing')
        .select('*')
        .maybeSingle()
      if (updated) {
        membership = updated as EarlyAdopterMembership
        transitioned += 1
        await sendOnce(membership, 'programme_completed')
      }
      continue
    }

    const graceExpired = membership.grace_ends_at && new Date(membership.grace_ends_at).getTime() <= nowTime
    const programmeExpired = membership.programme_expires_at && new Date(membership.programme_expires_at).getTime() <= nowTime
    if ((membership.status === 'active' || membership.status === 'grace') && (graceExpired || programmeExpired)) {
      const { data: updated } = await admin
        .from('early_adopter_memberships')
        .update({ status: 'removed', removed_at: now.toISOString() })
        .eq('id', membership.id)
        .in('status', ['active', 'grace'])
        .select('*')
        .maybeSingle()
      if (updated) {
        membership = updated as EarlyAdopterMembership
        transitioned += 1
        await sendOnce(membership, 'programme_removed')
      }
      continue
    }

    if (membership.status === 'active' && membership.feedback_due_at && new Date(membership.feedback_due_at).getTime() <= nowTime) {
      const { data: updated } = await admin
        .from('early_adopter_memberships')
        .update({ status: 'grace' })
        .eq('id', membership.id)
        .eq('status', 'active')
        .select('*')
        .maybeSingle()
      if (updated) {
        membership = updated as EarlyAdopterMembership
        transitioned += 1
      }
    }

    if (membership.grace_ends_at && new Date(membership.grace_ends_at).getTime() - (7 * DAY_MS) <= nowTime) {
      await sendOnce(membership, 'grace_final_week')
    } else if (membership.feedback_due_at && addUtcMonths(membership.feedback_due_at, 1).getTime() <= nowTime) {
      await sendOnce(membership, 'grace_month_one')
    } else if (membership.feedback_due_at && new Date(membership.feedback_due_at).getTime() <= nowTime) {
      await sendOnce(membership, 'feedback_due')
    } else if (membership.feedback_opens_at && new Date(membership.feedback_opens_at).getTime() <= nowTime) {
      await sendOnce(membership, 'feedback_window_open')
    }
  }

  return { processed: data?.length || 0, transitioned, noticesSent }
}
