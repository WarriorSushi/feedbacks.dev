const ETAG_VALUE = /^"([^"]+)"$/

export function formatVersionEtag(version: string): string {
  return `"${version.replaceAll('"', '')}"`
}

export function parseIfMatchVersion(value: string | null): string | null {
  if (!value) return null
  const match = ETAG_VALUE.exec(value.trim())
  return match?.[1] || null
}

export function editConflictResponse(currentVersion: string) {
  return {
    code: 'EDIT_CONFLICT',
    error: 'This content changed in another tab. Your draft is still available—reload the latest version, review it, and save again.',
    currentVersion,
  }
}
