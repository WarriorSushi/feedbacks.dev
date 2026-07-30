const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CROSS_ORIGIN_API_PREFIXES = [
  '/api/feedback',
  '/api/widget/',
  '/api/v1/',
  '/api/webhooks/',
  '/api/billing/webhook',
  '/api/cron/',
  '/api/internal/',
  '/api/test/',
  '/api/security/csp-report',
]

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function shouldEnforceCsrf(pathname: string, method: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false
  if (pathname === '/api/feedback') return false
  return !CROSS_ORIGIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isTrustedMutationOrigin({
  origin,
  requestOrigin,
  appOrigin,
  marketingOrigin,
}: {
  origin: string | null
  requestOrigin: string
  appOrigin?: string | null
  marketingOrigin?: string | null
}): boolean {
  const candidate = normalizeOrigin(origin)
  if (!candidate) return false
  const trusted = new Set([
    normalizeOrigin(requestOrigin),
    normalizeOrigin(appOrigin),
    normalizeOrigin(marketingOrigin),
  ].filter((value): value is string => Boolean(value)))
  return trusted.has(candidate)
}
