import fs from 'node:fs'
import path from 'node:path'

const envFiles = [
  path.join(process.cwd(), 'packages', 'dashboard', '.env.local'),
  path.join(process.cwd(), 'packages', 'dashboard', '.env'),
]

const required = [
  'PLAYWRIGHT_BASE_URL or APP_BASE_URL or NEXT_PUBLIC_APP_ORIGIN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_AUTH_BYPASS_SECRET',
  'E2E_ENVIRONMENT',
  'E2E_SUPABASE_PROJECT_REF',
  'E2E_EXPECTED_HOSTNAME',
  'E2E_TEST_NAMESPACE',
]
const PRODUCTION_SUPABASE_PROJECT_REF = 'xiiaugllydxxmjbtzfux'

function parseEnvValue(raw) {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\n/g, '\n')
  }

  const inlineCommentIndex = trimmed.search(/\s+#/)
  const withoutComment = inlineCommentIndex >= 0 ? trimmed.slice(0, inlineCommentIndex) : trimmed
  return withoutComment.trim()
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const source = fs.readFileSync(filePath, 'utf8')
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = parseEnvValue(rawValue)
  }
}

function hasEnv(name) {
  return Boolean(process.env[name]?.trim())
}

for (const filePath of envFiles) {
  loadEnvFile(filePath)
}

const hasBaseUrl = hasEnv('PLAYWRIGHT_BASE_URL') || hasEnv('APP_BASE_URL') || hasEnv('NEXT_PUBLIC_APP_ORIGIN')
const missing = required.filter((name) => {
  if (name.includes(' or ')) return !hasBaseUrl
  return !hasEnv(name)
})

if (missing.length > 0) {
  console.error('Cannot run required Playwright E2E acceptance tests.')
  console.error(`Missing env vars: ${missing.join(', ')}`)
  console.error('Use `pnpm test:e2e` when you intentionally want the suite to skip without a full local E2E environment.')
  process.exit(1)
}

const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
const actualSupabaseRef = supabaseHostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1]
const baseUrl = process.env.PLAYWRIGHT_BASE_URL
  || process.env.APP_BASE_URL
  || process.env.NEXT_PUBLIC_APP_ORIGIN
const actualHostname = new URL(baseUrl).hostname
const failures = []

if (process.env.E2E_ENVIRONMENT !== 'true') failures.push('E2E_ENVIRONMENT must equal true')
if (!actualSupabaseRef || actualSupabaseRef !== process.env.E2E_SUPABASE_PROJECT_REF) {
  failures.push('Supabase URL does not match E2E_SUPABASE_PROJECT_REF')
}
if (actualSupabaseRef === PRODUCTION_SUPABASE_PROJECT_REF) {
  failures.push('Production Supabase is forbidden for E2E')
}
if (actualHostname !== process.env.E2E_EXPECTED_HOSTNAME) {
  failures.push('Playwright hostname does not match E2E_EXPECTED_HOSTNAME')
}
if (!process.env.E2E_TEST_NAMESPACE.startsWith('e2e:')) {
  failures.push('E2E_TEST_NAMESPACE must use the e2e: namespace')
}

if (failures.length > 0) {
  console.error('Cannot run Playwright against this environment.')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Playwright E2E environment is ready.')
