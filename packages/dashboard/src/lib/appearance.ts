export const APPEARANCE_COOKIE_NAME = 'feedbacks-theme'

export const APPEARANCE_THEMES = ['light', 'dark', 'windows98', 'system'] as const

export type AppearanceTheme = (typeof APPEARANCE_THEMES)[number]

export function normalizeAppearanceTheme(value: string | null | undefined): AppearanceTheme | null {
  return APPEARANCE_THEMES.includes(value as AppearanceTheme) ? value as AppearanceTheme : null
}

export function persistSharedAppearance(theme: AppearanceTheme) {
  if (typeof window === 'undefined') return

  const hostname = window.location.hostname
  const sharedDomain = hostname === 'feedbacks.dev' || hostname.endsWith('.feedbacks.dev')
    ? '; Domain=.feedbacks.dev'
    : ''
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${APPEARANCE_COOKIE_NAME}=${encodeURIComponent(theme)}; Path=/; Max-Age=31536000; SameSite=Lax${sharedDomain}${secure}`
}
