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
    error: 'A newer saved version is available. Your text is still in the editor. Reload the page to get the latest version, review your changes, then save again.',
    currentVersion,
  }
}
