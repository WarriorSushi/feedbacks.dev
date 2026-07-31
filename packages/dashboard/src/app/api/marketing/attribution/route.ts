import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  MARKETING_ATTRIBUTION_COOKIE,
  hasMarketingConsent,
  sanitizeMarketingAttribution,
  signMarketingAttribution,
} from '@/lib/marketing'
import { readJsonBody } from '@/lib/api-request'

export async function POST(request: NextRequest) {
  if (!hasMarketingConsent(request)) {
    return NextResponse.json({ stored: false }, { status: 403 })
  }
  const rate = await checkRateLimit(request, 'marketing-attribution', 30, 10)
  if (!rate.allowed) return NextResponse.json({ stored: false }, { status: 429 })
  const body = await readJsonBody<Record<string, unknown>>(request)
  if (!body.ok) return body.response
  const attribution = sanitizeMarketingAttribution(body.data)
  const response = NextResponse.json({ stored: Object.keys(attribution).length > 0 })
  if (Object.keys(attribution).length > 0) {
    const hostname = request.nextUrl.hostname.toLowerCase()
    response.cookies.set(MARKETING_ATTRIBUTION_COOKIE, signMarketingAttribution(attribution), {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      ...(hostname === 'feedbacks.dev' || hostname.endsWith('.feedbacks.dev') ? { domain: '.feedbacks.dev' } : {}),
    })
  }
  return response
}
