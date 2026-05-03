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
]

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

console.log('Playwright E2E environment is ready.')
