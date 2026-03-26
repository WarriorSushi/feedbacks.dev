export interface E2EEnvironment {
  ready: boolean
  skipReason: string
  baseURL: string
  appOrigin: string
  authBypassSecret: string
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  testEmail: string
  testPassword: string
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function resolveBaseURL(): string | undefined {
  return readEnv('PLAYWRIGHT_BASE_URL')
    || readEnv('APP_BASE_URL')
    || readEnv('NEXT_PUBLIC_APP_ORIGIN')
}

export function isLocalBaseURL(baseURL: string): boolean {
  try {
    const url = new URL(baseURL)
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function getE2EEnvironment(): E2EEnvironment {
  const baseURL = resolveBaseURL()
  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  const authBypassSecret = readEnv('E2E_AUTH_BYPASS_SECRET')
  const testEmail = readEnv('PLAYWRIGHT_TEST_EMAIL') || 'playwright@feedbacks.dev'
  const testPassword = readEnv('PLAYWRIGHT_TEST_PASSWORD') || 'Playwright!12345'

  const missing: string[] = []
  if (!baseURL) missing.push('PLAYWRIGHT_BASE_URL or APP_BASE_URL')
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!authBypassSecret) missing.push('E2E_AUTH_BYPASS_SECRET')

  const ready = missing.length === 0

  return {
    ready,
    skipReason: ready
      ? ''
      : `Skipping Playwright e2e because required env vars are missing: ${missing.join(', ')}`,
    baseURL: stripTrailingSlash(baseURL || 'http://127.0.0.1:3000'),
    appOrigin: stripTrailingSlash(readEnv('NEXT_PUBLIC_APP_ORIGIN') || baseURL || 'http://127.0.0.1:3000'),
    authBypassSecret: authBypassSecret || '',
    supabaseUrl: supabaseUrl || '',
    supabaseAnonKey: supabaseAnonKey || '',
    supabaseServiceRoleKey: supabaseServiceRoleKey || '',
    testEmail,
    testPassword,
  }
}

export function skipE2EIfNeeded() {
  return getE2EEnvironment()
}

export function uniqueSuffix(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
