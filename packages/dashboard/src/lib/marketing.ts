import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminSupabase } from '@/lib/supabase-server'
import { env } from '@/lib/env'

export const MARKETING_CONSENT_COOKIE = 'feedbacks_marketing_consent'
export const MARKETING_ATTRIBUTION_COOKIE = 'feedbacks_attribution'
export const REFERRAL_COOKIE = 'feedbacks_referral'
export const MARKETING_CONSENT_VERSION = 'v1'

export type MarketingEventName = 'Lead' | 'CompleteRegistration' | 'ProjectCreated'

export type MarketingAttribution = Partial<Record<
  'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term' |
  'gclid' | 'gbraid' | 'wbraid' | 'fbclid' | 'rdt_cid',
  string
>>

const ATTRIBUTION_KEYS = new Set<keyof MarketingAttribution>([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'rdt_cid',
])

function cookieMap(request: Request) {
  const cookies = new Map<string, string>()
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const index = part.indexOf('=')
    if (index < 1) continue
    cookies.set(part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim()))
  }
  return cookies
}

function marketingCookieSecret() {
  return env.MARKETING_COOKIE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY
}

function safeValue(value: unknown) {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().slice(0, 240)
  return normalized && /^[\w .,:/@+%-]+$/u.test(normalized) ? normalized : undefined
}

export function sanitizeMarketingAttribution(input: unknown): MarketingAttribution {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const output: MarketingAttribution = {}
  for (const [key, rawValue] of Object.entries(input)) {
    if (!ATTRIBUTION_KEYS.has(key as keyof MarketingAttribution)) continue
    const value = safeValue(rawValue)
    if (value) output[key as keyof MarketingAttribution] = value
  }
  return output
}

export function signMarketingAttribution(attribution: MarketingAttribution) {
  const payload = Buffer.from(JSON.stringify(sanitizeMarketingAttribution(attribution))).toString('base64url')
  const signature = createHmac('sha256', marketingCookieSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function readMarketingAttribution(request: Request): MarketingAttribution {
  const signed = cookieMap(request).get(MARKETING_ATTRIBUTION_COOKIE)
  if (!signed) return {}
  const [payload, signature] = signed.split('.')
  if (!payload || !signature) return {}
  const expected = createHmac('sha256', marketingCookieSecret()).update(payload).digest()
  let received: Buffer
  try {
    received = Buffer.from(signature, 'base64url')
  } catch {
    return {}
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return {}
  try {
    return sanitizeMarketingAttribution(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')))
  } catch {
    return {}
  }
}

export function hasMarketingConsent(request: Request) {
  return cookieMap(request).get(MARKETING_CONSENT_COOKIE) === `${MARKETING_CONSENT_VERSION}.granted`
}

export function readReferralCode(request: Request) {
  const code = cookieMap(request).get(REFERRAL_COOKIE)?.trim()
  return code && /^[A-Za-z0-9_-]{10,32}$/.test(code) ? code : null
}

export function normalizeMarketingEmail(value: string) {
  return value.trim().toLowerCase()
}

export function hashMarketingValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function requestIp(request: Request) {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || undefined
}

function cleanSourceUrl(value: string | null | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    url.search = ''
    url.hash = ''
    return url.toString().slice(0, 500)
  } catch {
    return undefined
  }
}

function readCookieValue(request: Request, name: string) {
  return cookieMap(request).get(name)
}

async function sendMetaConversion(args: {
  eventId: string
  eventName: MarketingEventName
  emailHash?: string
  sourceUrl?: string
  attribution: MarketingAttribution
  request: Request
}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (!pixelId || !env.META_CAPI_ACCESS_TOKEN) return { configured: false }

  const userData: Record<string, unknown> = {
    client_ip_address: requestIp(args.request),
    client_user_agent: args.request.headers.get('user-agent') || undefined,
  }
  if (args.emailHash) userData.em = [args.emailHash]
  const fbp = readCookieValue(args.request, '_fbp')
  if (fbp) userData.fbp = fbp.slice(0, 180)
  if (args.attribution.fbclid) {
    userData.fbc = `fb.1.${Math.floor(Date.now() / 1000)}.${args.attribution.fbclid}`
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${encodeURIComponent(env.META_CAPI_API_VERSION)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(env.META_CAPI_ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: args.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: args.eventId,
            action_source: 'website',
            event_source_url: args.sourceUrl,
            user_data: userData,
          }],
          ...(env.META_CAPI_TEST_EVENT_CODE ? { test_event_code: env.META_CAPI_TEST_EVENT_CODE } : {}),
        }),
        signal: AbortSignal.timeout(4_000),
      },
    )
    return { configured: true, ok: response.ok, status: response.status }
  } catch {
    return { configured: true, ok: false, status: 0 }
  }
}

async function sendRedditConversion(args: {
  eventId: string
  eventName: MarketingEventName
  emailHash?: string
  userId?: string
  sourceUrl?: string
  attribution: MarketingAttribution
  request: Request
}) {
  const pixelId = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID
  if (!pixelId || !env.REDDIT_CAPI_ACCESS_TOKEN) return { configured: false }

  const eventType = args.eventName === 'Lead'
    ? { tracking_type: 'LEAD' }
    : args.eventName === 'CompleteRegistration'
      ? { tracking_type: 'SIGN_UP' }
      : { tracking_type: 'CUSTOM', custom_event_name: 'ProjectCreated' }

  try {
    const response = await fetch(
      `https://ads-api.reddit.com/api/v3/pixels/${encodeURIComponent(pixelId)}/conversion_events`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.REDDIT_CAPI_ACCESS_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            events: [{
              click_id: args.attribution.rdt_cid,
              event_at: Date.now(),
              action_source: 'WEBSITE',
              event_source_url: args.sourceUrl,
              type: eventType,
              metadata: { conversion_id: args.eventId },
              user: {
                email: args.emailHash,
                external_id: args.userId ? hashMarketingValue(args.userId) : undefined,
                ip_address: requestIp(args.request),
                user_agent: args.request.headers.get('user-agent') || undefined,
                uuid: args.eventId,
              },
            }],
          },
        }),
        signal: AbortSignal.timeout(4_000),
      },
    )
    return { configured: true, ok: response.ok, status: response.status }
  } catch {
    return { configured: true, ok: false, status: 0 }
  }
}

export async function recordMarketingConversion({
  eventId,
  eventName,
  email,
  userId,
  sourceUrl,
  attribution,
  request,
}: {
  eventId: string
  eventName: MarketingEventName
  email?: string | null
  userId?: string
  sourceUrl?: string | null
  attribution?: MarketingAttribution
  request: Request
}) {
  if (!hasMarketingConsent(request)) return { recorded: false as const, reason: 'consent_not_granted' as const }

  const admin = await createAdminSupabase()
  const cleanAttribution = sanitizeMarketingAttribution(attribution || readMarketingAttribution(request))
  const emailHash = email ? hashMarketingValue(normalizeMarketingEmail(email)) : undefined
  const cleanUrl = cleanSourceUrl(sourceUrl || request.headers.get('referer'))
  const { error: insertError } = await admin.from('marketing_conversion_events').insert({
    event_id: eventId,
    event_name: eventName,
    user_id: userId || null,
    email_hash: emailHash || null,
    source_url: cleanUrl || null,
    attribution: cleanAttribution,
    consent_version: MARKETING_CONSENT_VERSION,
  })

  if (insertError?.code === '23505') return { recorded: false as const, reason: 'duplicate' as const }
  if (insertError) return { recorded: false as const, reason: 'storage_failed' as const }

  const [meta, reddit] = await Promise.all([
    sendMetaConversion({ eventId, eventName, emailHash, sourceUrl: cleanUrl, attribution: cleanAttribution, request }),
    sendRedditConversion({ eventId, eventName, emailHash, userId, sourceUrl: cleanUrl, attribution: cleanAttribution, request }),
  ])
  const configured = [meta, reddit].filter((result) => result.configured)
  const delivered = configured.filter((result) => result.ok)
  const status = configured.length === 0 || delivered.length === configured.length
    ? 'delivered'
    : delivered.length > 0
      ? 'partial'
      : 'failed'

  await admin.from('marketing_conversion_events').update({
    provider_results: { meta, reddit, google: { configured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID), channel: 'browser' } },
    status,
    attempt_count: 1,
    delivered_at: status === 'delivered' ? new Date().toISOString() : null,
  }).eq('event_id', eventId)

  return { recorded: true as const, eventId, status }
}
