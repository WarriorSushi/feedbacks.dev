const PRODUCTION_SUPABASE_PROJECT_REF = 'xiiaugllydxxmjbtzfux'

function readEnv(name: string): string {
  return process.env[name]?.trim() || ''
}

export function getSupabaseProjectRef(value: string): string | null {
  try {
    const hostname = new URL(value).hostname
    const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/)
    return match?.[1] || null
  } catch {
    return null
  }
}

export function getConfiguredAppHostname(): string | null {
  const origin = readEnv('PLAYWRIGHT_BASE_URL')
    || readEnv('APP_BASE_URL')
    || readEnv('NEXT_PUBLIC_APP_ORIGIN')
  try {
    return origin ? new URL(origin).hostname : null
  } catch {
    return null
  }
}

export function getE2EEnvironmentSafety(): { safe: boolean; reason: string } {
  if (readEnv('E2E_ENVIRONMENT') !== 'true') {
    return { safe: false, reason: 'E2E_ENVIRONMENT must equal true' }
  }

  const actualRef = getSupabaseProjectRef(readEnv('NEXT_PUBLIC_SUPABASE_URL'))
  const expectedRef = readEnv('E2E_SUPABASE_PROJECT_REF')
  if (!actualRef || !expectedRef || actualRef !== expectedRef) {
    return { safe: false, reason: 'Supabase project ref does not match E2E_SUPABASE_PROJECT_REF' }
  }
  if (actualRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    return { safe: false, reason: 'Production Supabase is forbidden for E2E' }
  }

  const actualHostname = getConfiguredAppHostname()
  const expectedHostname = readEnv('E2E_EXPECTED_HOSTNAME')
  if (!actualHostname || !expectedHostname || actualHostname !== expectedHostname) {
    return { safe: false, reason: 'App hostname does not match E2E_EXPECTED_HOSTNAME' }
  }

  if (!readEnv('E2E_AUTH_BYPASS_SECRET')) {
    return { safe: false, reason: 'E2E_AUTH_BYPASS_SECRET is required' }
  }

  return { safe: true, reason: '' }
}

export function isSafeE2EEnvironment(): boolean {
  return getE2EEnvironmentSafety().safe
}
