import { sanitizeRedirectPath } from './redirects.ts'

export const DEFAULT_AUTH_REDIRECT = '/dashboard'

export function resolveAuthRedirect(requestedRedirect: string | null) {
  return sanitizeRedirectPath(requestedRedirect, DEFAULT_AUTH_REDIRECT)
}
