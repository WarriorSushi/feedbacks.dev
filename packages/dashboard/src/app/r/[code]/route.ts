import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { getAppOrigin } from '@/lib/domain-routing'
import { REFERRAL_COOKIE } from '@/lib/marketing'
import {
  getOrCreateReferralDevice,
  REFERRAL_DEVICE_COOKIE,
  REFERRAL_DEVICE_COOKIE_MAX_AGE,
} from '@/lib/referrals'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalizedCode = code.trim()
  const authUrl = new URL('/auth', getAppOrigin())
  authUrl.searchParams.set('redirect', '/projects/new')

  if (!/^[A-Za-z0-9_-]{10,32}$/.test(normalizedCode)) {
    authUrl.searchParams.set('error', 'invalid_invite')
    return NextResponse.redirect(authUrl)
  }

  const admin = await createAdminSupabase()
  const { data } = await admin
    .from('referral_programs')
    .select('code, successful_referrals')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (!data || data.successful_referrals >= 5) {
    authUrl.searchParams.set('error', data ? 'invite_complete' : 'invalid_invite')
    return NextResponse.redirect(authUrl)
  }

  authUrl.searchParams.set('invited', '1')
  const response = NextResponse.redirect(authUrl)
  const hostname = request.nextUrl.hostname.toLowerCase()
  const cookieDomain = hostname === 'feedbacks.dev' || hostname.endsWith('.feedbacks.dev')
    ? { domain: '.feedbacks.dev' }
    : {}
  response.cookies.set(REFERRAL_COOKIE, normalizedCode, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    ...cookieDomain,
  })
  const referralDevice = getOrCreateReferralDevice(request)
  response.cookies.set(REFERRAL_DEVICE_COOKIE, referralDevice.value, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: REFERRAL_DEVICE_COOKIE_MAX_AGE,
    ...cookieDomain,
  })
  return response
}
