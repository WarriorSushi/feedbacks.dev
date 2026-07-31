import { createServerSupabase } from '@/lib/supabase-server'
import { sanitizeRedirectPath } from '@/lib/redirects'
import { after, NextResponse } from 'next/server'
import { recordNewUserAcquisition } from '@/lib/referrals'
import { recordMarketingConversion, REFERRAL_COOKIE } from '@/lib/marketing'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = sanitizeRedirectPath(searchParams.get('redirect'), '/dashboard')

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      let acquisition: Awaited<ReturnType<typeof recordNewUserAcquisition>> = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) acquisition = await recordNewUserAcquisition(request, user)
        if (user && acquisition?.marketingConsent) {
          after(() => recordMarketingConversion({
            eventId: acquisition!.eventId,
            eventName: 'CompleteRegistration',
            email: user.email,
            userId: user.id,
            sourceUrl: `${origin}/auth`,
            attribution: acquisition!.attribution,
            request,
          }))
        }
      } catch (acquisitionError) {
        console.error('Could not record new-user acquisition', acquisitionError instanceof Error ? acquisitionError.message : 'unknown error')
      }

      const destination = new URL(redirect, origin)
      if (acquisition?.marketingConsent) {
        destination.searchParams.set('conversion', 'signup')
        destination.searchParams.set('conversion_event', acquisition.eventId)
      }
      const response = NextResponse.redirect(destination)
      const hostname = new URL(origin).hostname.toLowerCase()
      response.cookies.set(REFERRAL_COOKIE, '', {
        httpOnly: true,
        secure: destination.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        ...(hostname === 'feedbacks.dev' || hostname.endsWith('.feedbacks.dev') ? { domain: '.feedbacks.dev' } : {}),
      })
      return response
    }
  }

  const authUrl = new URL('/auth', origin)
  authUrl.searchParams.set('error', 'auth_failed')
  authUrl.searchParams.set('redirect', redirect)
  return NextResponse.redirect(authUrl)
}
