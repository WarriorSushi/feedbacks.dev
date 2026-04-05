import fs from 'node:fs'
import path from 'node:path'

const ENV_FILES = [
  path.join(process.cwd(), 'packages', 'dashboard', '.env.local'),
  path.join(process.cwd(), 'packages', 'dashboard', '.env'),
]

function parseEnvValue(raw: string): string {
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

function loadEnvFile(filePath: string) {
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

export function loadDashboardEnv() {
  for (const filePath of ENV_FILES) {
    loadEnvFile(filePath)
  }
}

loadDashboardEnv()
