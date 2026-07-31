import { randomBytes } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { createAdminSupabase } from '@/lib/supabase-server'
import {
  hasMarketingConsent,
  MARKETING_CONSENT_VERSION,
  readMarketingAttribution,
  readReferralCode,
} from '@/lib/marketing'

export async function getOrCreateReferralProgram(userId: string) {
  const admin = await createAdminSupabase()
  const { data: existing, error: lookupError } = await admin
    .from('referral_programs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = randomBytes(9).toString('base64url')
    const { data, error } = await admin
      .from('referral_programs')
      .insert({ user_id: userId, code })
      .select('*')
      .single()
    if (!error && data) return data
    if (error?.code !== '23505') throw error

    const { data: raced } = await admin
      .from('referral_programs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (raced) return raced
  }
  throw new Error('Could not create a unique invitation link')
}

export async function recordNewUserAcquisition(request: Request, user: User) {
  const createdAt = new Date(user.created_at).getTime()
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > 24 * 60 * 60 * 1000) return null

  const admin = await createAdminSupabase()
  const eventId = crypto.randomUUID()
  const referralCode = readReferralCode(request)
  const attribution = readMarketingAttribution(request)
  const { error } = await admin.from('user_acquisition').insert({
    user_id: user.id,
    referral_code: referralCode,
    attribution,
    consent_version: hasMarketingConsent(request) ? MARKETING_CONSENT_VERSION : null,
    signup_event_id: eventId,
  })
  if (error?.code === '23505') return null
  if (error) throw error

  if (referralCode) {
    await admin.rpc('claim_referral_signup', {
      p_invited_user_id: user.id,
      p_referral_code: referralCode,
    })
  }

  return { eventId, attribution, marketingConsent: hasMarketingConsent(request) }
}
