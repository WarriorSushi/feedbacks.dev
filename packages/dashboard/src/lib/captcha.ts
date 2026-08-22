export type CaptchaProvider = 'hcaptcha' | 'turnstile'

type CaptchaVerificationResponse = {
  success?: boolean
  action?: string
  'error-codes'?: string[]
}

export type CaptchaVerificationResult =
  | { ok: true }
  | { ok: false; reason: 'missing_token' | 'invalid_token' | 'misconfigured' | 'unavailable' }

type CaptchaConfiguration = {
  provider: CaptchaProvider
  siteKey: string
  secretKey: string | null
}

const VERIFY_URLS: Record<CaptchaProvider, string> = {
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
}

export function getCaptchaConfiguration(): CaptchaConfiguration | null {
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim()
  if (hcaptchaSiteKey) {
    return {
      provider: 'hcaptcha',
      siteKey: hcaptchaSiteKey,
      secretKey: process.env.HCAPTCHA_SECRET_KEY?.trim() || null,
    }
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  if (turnstileSiteKey) {
    return {
      provider: 'turnstile',
      siteKey: turnstileSiteKey,
      secretKey: process.env.TURNSTILE_SECRET_KEY?.trim() || null,
    }
  }

  return null
}

export function getTrustedClientIp(request: Request): string | null {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || null
}

export async function verifyCaptchaToken({
  provider,
  token,
  secretKey,
  siteKey,
  remoteIp,
  expectedAction,
}: {
  provider: CaptchaProvider
  token: string | null | undefined
  secretKey: string | null | undefined
  siteKey?: string | null
  remoteIp?: string | null
  expectedAction?: string
}): Promise<CaptchaVerificationResult> {
  const normalizedToken = token?.trim()
  if (!normalizedToken || normalizedToken.length > 8_192) {
    return { ok: false, reason: 'missing_token' }
  }
  if (!secretKey) {
    console.error(`Captcha verification is enabled for ${provider}, but its server secret is missing.`)
    return { ok: false, reason: 'misconfigured' }
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: normalizedToken,
  })
  if (remoteIp) body.set('remoteip', remoteIp)
  if (provider === 'hcaptcha' && siteKey) body.set('sitekey', siteKey)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const response = await fetch(VERIFY_URLS[provider], {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) {
      console.warn('Captcha verification provider returned an error response.', {
        provider,
        status: response.status,
      })
      return { ok: false, reason: 'unavailable' }
    }

    const result = await response.json() as CaptchaVerificationResponse
    const actionMatches = provider !== 'turnstile'
      || !expectedAction
      || result.action === expectedAction
    if (result.success === true && actionMatches) return { ok: true }

    console.warn('Captcha verification rejected a request.', {
      provider,
      errorCodes: result['error-codes'] || [],
      actionMatches,
    })
    return { ok: false, reason: 'invalid_token' }
  } catch (error) {
    console.warn('Captcha verification could not reach the provider.', {
      provider,
      cause: error instanceof Error ? error.name : 'unknown',
    })
    return { ok: false, reason: 'unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}

export async function verifyEarlyAdopterCaptcha(
  request: Request,
  token: string | null | undefined,
): Promise<CaptchaVerificationResult> {
  const configuration = getCaptchaConfiguration()
  if (!configuration) {
    if (process.env.NODE_ENV !== 'production') return { ok: true }
    console.error('Early Adopter claims are disabled because no CAPTCHA provider is configured.')
    return { ok: false, reason: 'misconfigured' }
  }

  return verifyCaptchaToken({
    ...configuration,
    token,
    remoteIp: getTrustedClientIp(request),
    expectedAction: 'early_adopter_claim',
  })
}
