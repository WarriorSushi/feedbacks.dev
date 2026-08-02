import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAppOrigin, getCanonicalHostRedirect, isProtectedAppPath } from '@/lib/domain-routing'
import { getLegacyProjectTabRedirect } from '@/lib/project-routes'
import { isTrustedMutationOrigin, shouldEnforceCsrf } from '@/lib/csrf'

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

function buildContentSecurityPolicy(nonce: string): string {
  const appOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.feedbacks.dev').replace(/\/+$/, '')
  const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  const supabaseWsOrigin = supabaseOrigin.replace(/^https:/, 'wss:')
  const dodoOrigin = process.env.DODO_PAYMENTS_ENVIRONMENT === 'live'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com'
  const developmentScriptSource = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  const turnstileOrigin = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? 'https://challenges.cloudflare.com' : ''
  const hcaptchaOrigin = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ? 'https://*.hcaptcha.com' : ''
  const hcaptchaScriptOrigin = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ? 'https://js.hcaptcha.com' : ''
  const trackingScriptSources = [
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ? 'https://www.googletagmanager.com' : '',
    process.env.NEXT_PUBLIC_META_PIXEL_ID ? 'https://connect.facebook.net' : '',
    process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID ? 'https://www.redditstatic.com' : '',
  ].filter(Boolean).join(' ')
  const trackingConnectSources = [
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ? 'https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net' : '',
    process.env.NEXT_PUBLIC_META_PIXEL_ID ? 'https://www.facebook.com' : '',
    process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID ? 'https://alb.reddit.com https://events.reddit.com' : '',
  ].filter(Boolean).join(' ')

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${turnstileOrigin} ${hcaptchaOrigin} ${hcaptchaScriptOrigin} ${trackingScriptSources}${developmentScriptSource}`.trim(),
    `style-src 'self' 'unsafe-inline' ${hcaptchaOrigin}`.trim(),
    `img-src 'self' data: blob: ${supabaseOrigin} ${trackingConnectSources}`.trim(),
    "font-src 'self' data:",
    `connect-src 'self' ${appOrigin} ${supabaseOrigin} ${supabaseWsOrigin} ${dodoOrigin} ${turnstileOrigin} ${hcaptchaOrigin} ${trackingConnectSources}`.trim(),
    "worker-src 'self' blob:",
    `frame-src 'self' ${turnstileOrigin} ${hcaptchaOrigin}`.trim(),
  ]
  if (process.env.NODE_ENV !== 'development') directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api/')
    && shouldEnforceCsrf(request.nextUrl.pathname, request.method)
    && !isTrustedMutationOrigin({
      origin: request.headers.get('origin'),
      requestOrigin: request.nextUrl.origin,
      appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN,
      marketingOrigin: process.env.NEXT_PUBLIC_MARKETING_ORIGIN || 'https://www.feedbacks.dev',
    })
  ) {
    return NextResponse.json(
      { code: 'invalid_origin', message: 'Request origin is not allowed' },
      { status: 403 },
    )
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-request-id', request.headers.get('x-request-id') || crypto.randomUUID())
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const earlyCanonicalRedirect = getCanonicalHostRedirect(request.nextUrl)
  if (earlyCanonicalRedirect && !(request.nextUrl.hostname === new URL(getAppOrigin()).hostname && request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(earlyCanonicalRedirect)
  }

  const legacyProjectTabRedirect = getLegacyProjectTabRedirect(request.nextUrl)
  if (legacyProjectTabRedirect) {
    return NextResponse.redirect(new URL(legacyProjectTabRedirect, request.url))
  }

  const requestHeaders = new Headers(request.headers)
  const nonce = createNonce()
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  supabaseResponse.headers.set('Content-Security-Policy', contentSecurityPolicy)
  supabaseResponse.headers.set('x-request-id', requestId)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          supabaseResponse.headers.set('Content-Security-Policy', contentSecurityPolicy)
          supabaseResponse.headers.set('x-request-id', requestId)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const canonicalRedirect = getCanonicalHostRedirect(request.nextUrl, Boolean(user))
  if (canonicalRedirect) {
    return NextResponse.redirect(canonicalRedirect)
  }

  if (isProtectedAppPath(request.nextUrl.pathname) && !user) {
    const url = new URL('/auth', getAppOrigin())
    url.pathname = '/auth'
    url.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth page
  if (request.nextUrl.pathname === '/auth' && user) {
    const url = new URL('/dashboard', getAppOrigin())
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|cdn/|widget/).*)',
  ],
}
