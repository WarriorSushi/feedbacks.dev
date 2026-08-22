import { after, NextRequest, NextResponse } from 'next/server'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import {
  hashMarketingValue,
  MARKETING_CONSENT_VERSION,
  normalizeMarketingEmail,
  readMarketingAttribution,
  recordMarketingConversion,
} from '@/lib/marketing'
import { activateEarlyAdopterMembership, joinEarlyAdopterProgramme } from '@/lib/early-adopter'
import { notifyEarlyAdopterWelcome } from '@/lib/notifications'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, 'marketing-lead', 5, 10)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a few minutes and try again.' }, { status: 429 })
  }

  const result = await readJsonBody<{
    email?: string
    useCase?: string
    applicationStage?: string
    installTimeline?: string
    currentTool?: string
    newsletterConsent?: boolean
    programmeTermsAccepted?: boolean
    companyWebsite?: string
  }>(request)
  if (!result.ok) return result.response

  // Hidden honeypot: real users never see or fill this field.
  if (result.data.companyWebsite) return NextResponse.json({ accepted: true })
  const email = normalizeMarketingEmail(result.data.email || '')
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({
      error: 'Review the highlighted email address.',
      fieldErrors: { email: ['Enter a valid email address.'] },
    }, { status: 400 })
  }
  if (result.data.programmeTermsAccepted !== true) {
    return NextResponse.json({
      error: 'Confirm the programme renewal terms.',
      fieldErrors: { programmeTermsAccepted: ['Accept the programme terms to reserve a place.'] },
    }, { status: 400 })
  }

  let membership: Awaited<ReturnType<typeof joinEarlyAdopterProgramme>>
  try {
    membership = await joinEarlyAdopterProgramme(email)
  } catch {
    return NextResponse.json({ error: 'We could not reserve your programme place. Please try again.' }, { status: 500 })
  }
  if (!membership.accepted) {
    return NextResponse.json({ error: 'All 100 Early Adopter Programme places have now been reserved.', full: true }, { status: 409 })
  }

  const attribution = readMarketingAttribution(request)
  const now = new Date().toISOString()
  if (result.data.newsletterConsent === true) {
    const admin = await createAdminSupabase()
    const useCase = typeof result.data.useCase === 'string' ? result.data.useCase.trim().slice(0, 500) : null
    const { error } = await admin.from('marketing_leads').upsert({
      email,
      email_hash: hashMarketingValue(email),
      use_case: useCase || null,
      source: 'early-adopter-programme',
      consent_version: 'lead-v1',
      consented_at: now,
      attribution,
      updated_at: now,
    }, { onConflict: 'email_hash' })
    if (error) return NextResponse.json({ error: 'Your place is reserved, but we could not save your email preference. Please try again.' }, { status: 500 })
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const accountLinked = Boolean(user?.email && user.email.toLowerCase() === email)
  if (user && accountLinked) await activateEarlyAdopterMembership(user.id, email)

  const eventId = crypto.randomUUID()
  after(async () => {
    await Promise.all([
      recordMarketingConversion({
        eventId,
        eventName: 'Lead',
        email,
        sourceUrl: request.headers.get('referer'),
        attribution,
        request,
      }),
      membership.alreadyJoined || !membership.seatNumber
        ? Promise.resolve(false)
        : notifyEarlyAdopterWelcome({ email, seatNumber: membership.seatNumber }),
    ])
  })

  return NextResponse.json({
    accepted: true,
    seatNumber: membership.seatNumber,
    alreadyJoined: membership.alreadyJoined,
    accountLinked,
    eventId,
    consentVersion: MARKETING_CONSENT_VERSION,
  })
}
