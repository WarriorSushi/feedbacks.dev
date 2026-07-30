export function normalizeProjectDomain(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || value.trim().length > 253) return undefined
  try {
    const candidate = value.trim()
    const parsed = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname) {
      return undefined
    }
    return parsed.hostname.toLowerCase()
  } catch {
    return undefined
  }
}
