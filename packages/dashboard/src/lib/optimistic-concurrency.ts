const ETAG_VALUE = /^"([^"]+)"$/

export const MUTATION_VERSION_HEADER = 'X-Feedbacks-Version'

export function formatVersionEtag(version: string): string {
  return `"${version.replaceAll('"', '')}"`
}

export function parseIfMatchVersion(value: string | null): string | null {
  if (!value) return null
  const match = ETAG_VALUE.exec(value.trim())
  return match?.[1] || null
}

export function mutationVersionHeaders(version: string): Record<string, string> {
  return { [MUTATION_VERSION_HEADER]: version }
}

export function parseMutationVersion(headers: Pick<Headers, 'get'>): string | null {
  const applicationVersion = headers.get(MUTATION_VERSION_HEADER)?.trim()
  if (applicationVersion) return applicationVersion
  return parseIfMatchVersion(headers.get('if-match'))
}

export function editConflictResponse(currentVersion: string) {
  return {
    code: 'EDIT_CONFLICT',
    error: 'A newer saved version is available. Your text is still in the editor. Use Reload saved version to load it, review your changes, then save again.',
    currentVersion,
  }
}
