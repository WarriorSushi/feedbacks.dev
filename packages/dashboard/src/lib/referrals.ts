import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
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

export async function getReferralProgramSummary(userId: string) {
  const program = await getOrCreateReferralProgram(userId)
  const admin = await createAdminSupabase()
  const { data, error } = await admin
    .from('referral_signups')
    .select('status')
    .eq('inviter_user_id', userId)
  if (error) throw error
  const rows = data || []
  return {
    ...program,
    pending_referrals: rows.filter((row) => row.status === 'pending').length,
    review_referrals: rows.filter((row) => row.status === 'review').length,
  }
}

export const REFERRAL_DEVICE_COOKIE = 'feedbacks_referral_device'
export const REFERRAL_DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 90
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeReferralEmail(value: string) {
  const normalized = value.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0) return normalized
  let local = normalized.slice(0, at)
  let domain = normalized.slice(at + 1)
  if (domain === 'googlemail.com') domain = 'gmail.com'
  if (domain === 'gmail.com') local = local.split('+')[0].replace(/\./g, '')
  return `${local}@${domain}`
}

function referralSalt() {
  const value = process.env.REFERRAL_ABUSE_SALT?.trim() || process.env.CRON_SECRET?.trim()
  if (value) return value
  if (process.env.NODE_ENV === 'production') throw new Error('REFERRAL_ABUSE_SALT is required in production')
  return '_feedbacks_referral_abuse_dev_only'
}

function digestReferralSignal(value: string) {
  return createHmac('sha256', referralSalt()).update(value).digest('hex')
}

function signReferralDeviceId(deviceId: string) {
  return createHmac('sha256', referralSalt()).update(`v1.${deviceId}`).digest('base64url')
}

function readRequestCookie(request: Request, name: string) {
  for (const item of (request.headers.get('cookie') || '').split(';')) {
    const [cookieName, ...parts] = item.trim().split('=')
    if (cookieName !== name) continue
    try {
      return decodeURIComponent(parts.join('='))
    } catch {
      return null
    }
  }
  return null
}

function readReferralDeviceId(request: Request) {
  const encoded = readRequestCookie(request, REFERRAL_DEVICE_COOKIE)
  if (!encoded) return null
  const [version, deviceId, signature] = encoded.split('.')
  if (version !== 'v1' || !UUID_RE.test(deviceId || '') || !signature) return null

  const expected = Buffer.from(signReferralDeviceId(deviceId), 'base64url')
  let received: Buffer
  try {
    received = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  return received.length === expected.length && timingSafeEqual(received, expected) ? deviceId : null
}

export function getOrCreateReferralDevice(request: Request) {
  const existingId = readReferralDeviceId(request)
  const deviceId = existingId || randomUUID()
  return {
    isNew: !existingId,
    value: `v1.${deviceId}.${signReferralDeviceId(deviceId)}`,
  }
}

function requestIpPrefix(request: Request) {
  const raw = (request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || '').trim()
  if (!raw) return null
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) return raw.split('.').slice(0, 3).join('.')
  const ipv6 = raw.toLowerCase().replace(/^\[|\]$/g, '')
  if (ipv6.includes(':')) return ipv6.split(':').slice(0, 4).join(':')
  return null
}

function referralSignals(request: Request, email: string) {
  const networkPrefix = requestIpPrefix(request)
  const referralDeviceId = readReferralDeviceId(request)
  const userAgent = request.headers.get('user-agent')?.slice(0, 400) || 'unknown'
  const language = request.headers.get('accept-language')?.slice(0, 120) || 'unknown'
  return {
    emailHash: digestReferralSignal(`email:${normalizeReferralEmail(email)}`),
    networkHash: networkPrefix ? digestReferralSignal(`network:${networkPrefix}`) : null,
    // The signed first-party ID distinguishes coworkers on the same network.
    // The bounded browser fallback is retained for old invite links only.
    deviceHash: digestReferralSignal(referralDeviceId
      ? `device:${referralDeviceId}`
      : `legacy-device:${userAgent}:${language}`),
  }
}

export async function qualifyReferralSignup(userId: string) {
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('qualify_referral_signup', {
    p_invited_user_id: userId,
  })
  if (error) throw error
  const result = data as { reward_granted?: boolean; inviter_user_id?: string } | null
  if (result?.reward_granted && result.inviter_user_id) {
    await admin.rpc('reconcile_plan_projects', {
      p_user_id: result.inviter_user_id,
      p_effective_pro: true,
      p_free_project_limit: 2,
    })
  }
  return data
}

export async function recordNewUserAcquisition(request: Request, user: User) {
  const createdAt = new Date(user.created_at).getTime()
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > 24 * 60 * 60 * 1000) return null

  const admin = await createAdminSupabase()
  const eventId = crypto.randomUUID()
  const referralCode = readReferralCode(request)
  const attribution = readMarketingAttribution(request)
  const signals = user.email ? referralSignals(request, user.email) : null
  const { error } = await admin.from('user_acquisition').insert({
    user_id: user.id,
    referral_code: referralCode,
    attribution,
    consent_version: hasMarketingConsent(request) ? MARKETING_CONSENT_VERSION : null,
    signup_event_id: eventId,
    network_hash: signals?.networkHash || null,
    device_hash: signals?.deviceHash || null,
  })
  if (error?.code === '23505') return null
  if (error) throw error

  if (referralCode && signals && user.email) {
    const { data: program } = await admin
      .from('referral_programs')
      .select('user_id')
      .eq('code', referralCode)
      .maybeSingle()
    if (program?.user_id && program.user_id !== user.id) {
      const { data: inviterResult } = await admin.auth.admin.getUserById(program.user_id)
      const inviterEmail = inviterResult.user?.email
      const sameEmail = inviterEmail
        ? normalizeReferralEmail(inviterEmail) === normalizeReferralEmail(user.email)
        : false
      if (!sameEmail) {
        const { error: referralError } = await admin.rpc('register_referral_signup', {
          p_invited_user_id: user.id,
          p_referral_code: referralCode,
          p_invited_email_hash: signals.emailHash,
          p_network_hash: signals.networkHash,
          p_device_hash: signals.deviceHash,
        })
        if (referralError) throw referralError
      }
    }
  }

  return { eventId, attribution, marketingConsent: hasMarketingConsent(request) }
}
