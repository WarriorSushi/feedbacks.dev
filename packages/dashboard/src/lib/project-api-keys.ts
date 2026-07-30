const PROJECT_API_KEY_STORAGE_PREFIX = 'feedbacks:project-api-key:'
const PUBLISHABLE_PROJECT_KEY_PREFIX = 'fb_pub_'
const PRIVATE_PROJECT_API_KEY_PREFIX = 'fb_live_'
const COMPACT_UUID_RE = /^[0-9a-f]{32}$/i
const LEGACY_PROJECT_KEY_RE = /^fb_[A-Za-z0-9_-]+$/

export function generateProjectApiKey() {
  return `${PRIVATE_PROJECT_API_KEY_PREFIX}${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export function getProjectPublishableKey(projectId: string) {
  const compactProjectId = projectId.replace(/-/g, '').toLowerCase()
  if (!COMPACT_UUID_RE.test(compactProjectId)) {
    throw new Error('Project ID must be a UUID')
  }
  return `${PUBLISHABLE_PROJECT_KEY_PREFIX}${compactProjectId}`
}

export function parseProjectPublishableKey(key: string): string | null {
  if (!key.startsWith(PUBLISHABLE_PROJECT_KEY_PREFIX)) return null
  const compactProjectId = key.slice(PUBLISHABLE_PROJECT_KEY_PREFIX.length)
  if (!COMPACT_UUID_RE.test(compactProjectId)) return null
  return [
    compactProjectId.slice(0, 8),
    compactProjectId.slice(8, 12),
    compactProjectId.slice(12, 16),
    compactProjectId.slice(16, 20),
    compactProjectId.slice(20),
  ].join('-')
}

export function isPrivateProjectApiKey(key: string) {
  return key.startsWith(PRIVATE_PROJECT_API_KEY_PREFIX)
}

export async function getPublicProjectLookup(key: string): Promise<
  { column: 'id' | 'api_key_hash'; value: string } | null
> {
  const projectId = parseProjectPublishableKey(key)
  if (projectId) return { column: 'id', value: projectId }
  if (key.startsWith(PUBLISHABLE_PROJECT_KEY_PREFIX)) return null

  // Existing embeds used the original fb_ credential. Keep those browser
  // installs working during migration, but never accept a private fb_live_
  // credential on a public widget endpoint.
  if (!LEGACY_PROJECT_KEY_RE.test(key) || isPrivateProjectApiKey(key)) return null
  return { column: 'api_key_hash', value: await hashProjectApiKey(key) }
}

export async function hashProjectApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export function getProjectApiKeyLastFour(key: string) {
  return key.slice(-4)
}

export function getProjectApiKeyStorageKey(projectId: string) {
  return `${PROJECT_API_KEY_STORAGE_PREFIX}${projectId}`
}

export function rememberProjectApiKey(projectId: string, apiKey: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(getProjectApiKeyStorageKey(projectId), apiKey)
}

export function readStoredProjectApiKey(projectId: string) {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(getProjectApiKeyStorageKey(projectId))
}

export function forgetStoredProjectApiKey(projectId: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(getProjectApiKeyStorageKey(projectId))
}
