const TEST_WEBHOOK_TARGET_PREFIX = '/api/test/webhook-target/'

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getE2EBypassSecret(): string | null {
  const secret = process.env.E2E_AUTH_BYPASS_SECRET?.trim()
  return secret ? secret : null
}

export function getServerAppOrigin(): string | null {
  const origin = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_ORIGIN?.trim()
  return origin ? stripTrailingSlash(origin) : null
}

export function isE2ETestWebhookUrl(
  value: string,
  options: { requireSecret?: boolean } = {},
): boolean {
  const requireSecret = options.requireSecret ?? true
  const appOrigin = getServerAppOrigin()

  if (!appOrigin) return false
  if (requireSecret && !getE2EBypassSecret()) return false

  try {
    const target = new URL(value)
    const allowedOrigin = new URL(appOrigin)
    return target.origin === allowedOrigin.origin && target.pathname.startsWith(TEST_WEBHOOK_TARGET_PREFIX)
  } catch {
    return false
  }
}

export function buildE2ETestWebhookUrl(kind: string): string | null {
  const appOrigin = getServerAppOrigin()
  if (!appOrigin) return null
  return `${appOrigin}${TEST_WEBHOOK_TARGET_PREFIX}${kind}`
}
