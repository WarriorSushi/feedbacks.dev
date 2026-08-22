import { createAdminSupabase } from '@/lib/supabase-server'
import { hashMarketingValue, normalizeMarketingEmail } from '@/lib/marketing'
import type { Database, Json } from '@/lib/database.types'

export const EARLY_ADOPTER_CAPACITY = 100
export const EARLY_ADOPTER_MAX_PRO_MONTHS = 12
export const EARLY_ADOPTER_FEEDBACK_WINDOW_DAYS = 7

export type EarlyAdopterMembership = Database['public']['Tables']['early_adopter_memberships']['Row']
export type EarlyAdopterStatus =
  | 'accepted'
  | 'onboarding'
  | 'active'
  | 'grace'
  | 'finishing'
  | 'completed'
  | 'removed'

export type EarlyAdopterJoinResult = {
  accepted: boolean
  seatNumber?: number
  status?: EarlyAdopterStatus
  alreadyJoined?: boolean
  claimReady?: boolean
  reason?: 'capacity_full'
}

export type EarlyAdopterActivationResult = {
  linked: boolean
  membershipId?: string
  seatNumber?: number
  status?: EarlyAdopterStatus
  claimReady?: boolean
  reason?: 'not_enrolled' | 'already_linked' | 'removed' | 'capacity_full'
}

export type EarlyAdopterRenewalResult = {
  renewed: boolean
  reason?: string
  proMonthsEarned?: number
  complimentaryProUntil?: string
  status?: EarlyAdopterStatus
  feedbackOpensAt?: string | null
  feedbackDueAt?: string | null
  programmeEndsAt?: string | null
}

function asObject(value: Json | null): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asString(value: Json | undefined) {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: Json | undefined) {
  return typeof value === 'number' ? value : undefined
}

function asBoolean(value: Json | undefined) {
  return typeof value === 'boolean' ? value : undefined
}

function parseJoinResult(value: Json | null): EarlyAdopterJoinResult {
  const row = asObject(value)
  return {
    accepted: asBoolean(row.accepted) === true,
    seatNumber: asNumber(row.seatNumber),
    status: asString(row.status) as EarlyAdopterStatus | undefined,
    alreadyJoined: asBoolean(row.alreadyJoined),
    claimReady: asBoolean(row.claimReady),
    reason: asString(row.reason) as EarlyAdopterJoinResult['reason'],
  }
}

function parseActivationResult(value: Json | null): EarlyAdopterActivationResult {
  const row = asObject(value)
  return {
    linked: asBoolean(row.linked) === true,
    membershipId: asString(row.membershipId),
    seatNumber: asNumber(row.seatNumber),
    status: asString(row.status) as EarlyAdopterStatus | undefined,
    claimReady: asBoolean(row.claimReady),
    reason: asString(row.reason) as EarlyAdopterActivationResult['reason'],
  }
}

function parseRenewalResult(value: Json | null): EarlyAdopterRenewalResult {
  const row = asObject(value)
  return {
    renewed: asBoolean(row.renewed) === true,
    reason: asString(row.reason),
    proMonthsEarned: asNumber(row.proMonthsEarned),
    complimentaryProUntil: asString(row.complimentaryProUntil),
    status: asString(row.status) as EarlyAdopterStatus | undefined,
    feedbackOpensAt: asString(row.feedbackOpensAt) || null,
    feedbackDueAt: asString(row.feedbackDueAt) || null,
    programmeEndsAt: asString(row.programmeEndsAt) || null,
  }
}

export async function getEarlyAdopterAvailability() {
  const admin = await createAdminSupabase()
  const [{ data: programme, error: programmeError }, { count, error: countError }] = await Promise.all([
    admin.from('early_adopter_programmes').select('capacity, enrolment_open').eq('id', 1).maybeSingle(),
    admin.from('early_adopter_memberships').select('id', { count: 'exact', head: true }).not('seat_number', 'is', null),
  ])

  if (programmeError || countError) {
    return { capacity: EARLY_ADOPTER_CAPACITY, joined: 0, remaining: EARLY_ADOPTER_CAPACITY, open: true }
  }

  const capacity = programme?.capacity || EARLY_ADOPTER_CAPACITY
  const joined = count || 0
  return {
    capacity,
    joined,
    remaining: Math.max(0, capacity - joined),
    open: programme?.enrolment_open !== false && joined < capacity,
  }
}

export async function joinEarlyAdopterProgramme(emailInput: string) {
  const email = normalizeMarketingEmail(emailInput)
  const emailHash = hashMarketingValue(email)
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('accept_early_adopter', {
    p_email: email,
    p_email_hash: emailHash,
  })
  if (error) throw new Error(error.message)
  return { email, emailHash, ...parseJoinResult(data) }
}

export async function activateEarlyAdopterMembership(userId: string, emailInput: string) {
  const email = normalizeMarketingEmail(emailInput)
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('activate_early_adopter_membership', {
    p_user_id: userId,
    p_email: email,
    p_email_hash: hashMarketingValue(email),
  })
  if (error) throw new Error(error.message)
  return parseActivationResult(data)
}

export async function getEarlyAdopterMembershipForUser(userId: string) {
  const admin = await createAdminSupabase()
  const { data, error } = await admin
    .from('early_adopter_memberships')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return null
    throw new Error(error.message)
  }
  return data as EarlyAdopterMembership | null
}

export function isEarlyAdopterProgrammeActive(membership: EarlyAdopterMembership | null | undefined) {
  return Boolean(membership && ['accepted', 'onboarding', 'active', 'grace', 'finishing'].includes(membership.status))
}

export function deriveEarlyAdopterStatus(
  membership: EarlyAdopterMembership,
  now = new Date(),
): EarlyAdopterStatus {
  const time = now.getTime()
  if (membership.status === 'finishing' && membership.programme_ends_at && new Date(membership.programme_ends_at).getTime() <= time) {
    return 'completed'
  }
  if (
    ['active', 'grace'].includes(membership.status)
    && (
      (membership.grace_ends_at && new Date(membership.grace_ends_at).getTime() < time)
      || (membership.programme_expires_at && new Date(membership.programme_expires_at).getTime() < time)
    )
  ) {
    return 'removed'
  }
  if (membership.status === 'active' && membership.feedback_due_at && new Date(membership.feedback_due_at).getTime() <= time) {
    return 'grace'
  }
  return membership.status as EarlyAdopterStatus
}

export function isEarlyAdopterFeedbackOpen(membership: EarlyAdopterMembership, now = new Date()) {
  if (!membership.feedback_opens_at || membership.pro_months_earned >= EARLY_ADOPTER_MAX_PRO_MONTHS) return false
  const status = deriveEarlyAdopterStatus(membership, now)
  return ['active', 'grace'].includes(status) && new Date(membership.feedback_opens_at).getTime() <= now.getTime()
}

export async function completeEarlyAdopterOnboarding(userId: string) {
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('complete_early_adopter_onboarding', { p_user_id: userId })
  if (error) throw new Error(error.message)
  const row = asObject(data)
  return {
    granted: asBoolean(row.granted) === true,
    reason: asString(row.reason),
    seatNumber: asNumber(row.seatNumber),
    proMonthsEarned: asNumber(row.proMonthsEarned),
    complimentaryProUntil: asString(row.complimentaryProUntil),
  }
}

export async function submitEarlyAdopterFeedback(input: {
  userId: string
  good: string
  bad: string
  improve: string
  anythingElse?: string
}) {
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('submit_early_adopter_feedback', {
    p_user_id: input.userId,
    p_good: input.good,
    p_bad: input.bad,
    p_improve: input.improve,
    p_anything_else: input.anythingElse || '',
  })
  if (error) throw new Error(error.message)
  return parseRenewalResult(data)
}
