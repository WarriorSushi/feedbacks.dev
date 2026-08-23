import { env, isEmailEnabled } from '@/lib/env'
import { createAdminSupabase } from '@/lib/supabase-server'

export type EmailDeliveryStatus =
  | 'ready'
  | 'configured'
  | 'unconfigured'
  | 'domain_unverified'
  | 'provider_unavailable'

export interface EmailDeliveryCapability {
  available: boolean
  status: EmailDeliveryStatus
  senderDomain: string | null
}

function getSenderDomain(from: string | null) {
  if (!from) return null
  const address = from.match(/<([^>]+)>/)?.[1] ?? from
  const atIndex = address.lastIndexOf('@')
  if (atIndex < 1 || atIndex === address.length - 1) return null
  return address.slice(atIndex + 1).trim().toLowerCase()
}

export function classifyResendFailure(status: number, body: string) {
  const normalized = body.toLowerCase()
  if (normalized.includes('domain') && normalized.includes('not verified')) {
    return 'domain_unverified' as const
  }
  if (status === 401 || status === 403 || normalized.includes('api key')) {
    return 'provider_unavailable' as const
  }
  return 'provider_unavailable' as const
}

export async function getEmailDeliveryCapability(): Promise<EmailDeliveryCapability> {
  const senderDomain = getSenderDomain(env.RESEND_FROM_EMAIL)
  if (!isEmailEnabled() || !senderDomain) {
    return { available: false, status: 'unconfigured', senderDomain }
  }

  const admin = await createAdminSupabase()
  const { data, error } = await admin
    .from('email_delivery_events')
    .select('event_type, reason')
    .like('provider_event_id', 'send:%')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { available: false, status: 'provider_unavailable', senderDomain }
  if (!data) return { available: true, status: 'configured', senderDomain }
  if (data.event_type !== 'email.failed') {
    return { available: true, status: 'ready', senderDomain }
  }

  const status = data.reason === 'domain_unverified'
    ? 'domain_unverified'
    : 'provider_unavailable'
  return { available: false, status, senderDomain }
}
