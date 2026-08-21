import { after, NextRequest, NextResponse } from 'next/server'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminSupabase } from '@/lib/supabase-server'
import {
  hashMarketingValue,
  MARKETING_CONSENT_VERSION,
  normalizeMarketingEmail,
  readMarketingAttribution,
  recordMarketingConversion,
} from '@/lib/marketing'
import { validateBetaApplication } from '@/lib/beta-application'

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
  if (result.data.newsletterConsent !== true) {
    return NextResponse.json({
      error: 'Confirm that you want product and launch emails.',
      fieldErrors: { newsletterConsent: ['Consent is required to join the email list.'] },
    }, { status: 400 })
  }

  const application = validateBetaApplication(result.data)
  if (!application.ok) {
    return NextResponse.json({
      error: 'Review the highlighted application details.',
      fieldErrors: application.fieldErrors,
    }, { status: 400 })
  }

  const attribution = readMarketingAttribution(request)
  const admin = await createAdminSupabase()
  const now = new Date().toISOString()
  const { error } = await admin.from('marketing_leads').upsert({
    email,
    email_hash: hashMarketingValue(email),
    use_case: application.value.useCase,
    source: 'founding-beta',
    consent_version: 'lead-v1',
    consented_at: now,
    attribution,
    updated_at: now,
  }, { onConflict: 'email_hash' })

  if (error) return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 500 })

  const { error: applicationError } = await admin.from('beta_applications').upsert({
    email,
    email_hash: hashMarketingValue(email),
    use_case: application.value.useCase,
    product_stage: application.value.applicationStage,
    install_timeline: application.value.installTimeline,
    current_tool: application.value.currentTool,
    applied_at: now,
    updated_at: now,
  }, { onConflict: 'email_hash' })

  if (applicationError) {
    return NextResponse.json({ error: 'We saved your email but could not complete the beta application. Please try again.' }, { status: 500 })
  }

  const eventId = crypto.randomUUID()
  after(() => recordMarketingConversion({
    eventId,
    eventName: 'Lead',
    email,
    sourceUrl: request.headers.get('referer'),
    attribution,
    request,
  }))

  return NextResponse.json({ accepted: true, eventId, consentVersion: MARKETING_CONSENT_VERSION })
}
