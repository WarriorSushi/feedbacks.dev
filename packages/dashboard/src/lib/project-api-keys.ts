const PROJECT_API_KEY_STORAGE_PREFIX = 'feedbacks:project-api-key:'

export function generateProjectApiKey() {
  return `fb_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
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
