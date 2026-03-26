export type BoardVisibility = 'public' | 'unlisted' | 'private'

export interface BoardAnnouncement {
  id: string
  title: string
  body: string
  publishedAt: string
  href?: string
}

export interface BoardBranding {
  accentColor?: string
  logoEmoji?: string
  heroEyebrow?: string
  heroTitle?: string
  heroDescription?: string
  tagline?: string
  websiteUrl?: string
  categories?: string[]
  visibility?: BoardVisibility
  directoryOptIn?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  announcements?: BoardAnnouncement[]
}

export interface BoardBrandingColumns {
  visibility: BoardVisibility
  directory_opt_in: boolean
  accent_color: string | null
  logo_emoji: string | null
  hero_eyebrow: string | null
  hero_title: string | null
  hero_description: string | null
  tagline: string | null
  website_url: string | null
  categories: string[]
  empty_state_title: string | null
  empty_state_description: string | null
}

type BoardBrandingInput = Partial<Record<keyof BoardBranding, unknown>>

type BoardBrandingSource = {
  branding?: Record<string, unknown> | null
  visibility?: unknown
  directory_opt_in?: unknown
  accent_color?: unknown
  logo_emoji?: unknown
  hero_eyebrow?: unknown
  hero_title?: unknown
  hero_description?: unknown
  tagline?: unknown
  website_url?: unknown
  categories?: unknown
  empty_state_title?: unknown
  empty_state_description?: unknown
  accentColor?: unknown
  logoEmoji?: unknown
  heroEyebrow?: unknown
  heroTitle?: unknown
  heroDescription?: unknown
  websiteUrl?: unknown
  directoryOptIn?: unknown
  emptyStateTitle?: unknown
  emptyStateDescription?: unknown
  announcements?: unknown
}

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function sanitizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function sanitizeUrl(value: unknown): string | undefined {
  const trimmed = sanitizeString(value, 500)
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

function sanitizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return HEX_COLOR_RE.test(trimmed) ? trimmed : undefined
}

function sanitizeCategories(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined

  const categories = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)

  return categories.length > 0 ? [...new Set(categories)] : undefined
}

function sanitizeVisibility(value: unknown): BoardVisibility | undefined {
  return value === 'public' || value === 'unlisted' || value === 'private'
    ? value
    : undefined
}

function sanitizeBoardAnnouncement(
  input: Record<string, unknown>,
  index: number,
): BoardAnnouncement | null {
  const title = sanitizeString(input.title, 120)
  const body = sanitizeString(input.body, 600)
  const publishedAt = sanitizeString(
    input.publishedAt ?? input.published_at ?? input.date,
    40,
  )

  if (!title || !body || !publishedAt) return null

  return {
    id: sanitizeString(input.id, 120) || `announcement-${index + 1}`,
    title,
    body,
    publishedAt,
    ...(sanitizeUrl(input.href) ? { href: sanitizeUrl(input.href) } : {}),
  }
}

function sanitizeAnnouncements(value: unknown): BoardAnnouncement[] | undefined {
  if (!Array.isArray(value)) return undefined

  const announcements = value
    .map((entry, index) => sanitizeBoardAnnouncement(asRecord(entry) || {}, index))
    .filter((entry): entry is BoardAnnouncement => Boolean(entry))

  return announcements.length > 0 ? announcements : undefined
}

function parseLegacyBranding(input: Record<string, unknown> | undefined): BoardBranding {
  if (!input) return {}

  return {
    accentColor: sanitizeColor(input.accentColor ?? input.accent_color),
    logoEmoji: sanitizeString(input.logoEmoji ?? input.logo_emoji, 32),
    heroEyebrow: sanitizeString(input.heroEyebrow ?? input.hero_eyebrow, 80),
    heroTitle: sanitizeString(input.heroTitle ?? input.hero_title, 120),
    heroDescription: sanitizeString(input.heroDescription ?? input.hero_description, 280),
    tagline: sanitizeString(input.tagline, 120),
    websiteUrl: sanitizeUrl(input.websiteUrl ?? input.website_url),
    categories: sanitizeCategories(input.categories),
    visibility: sanitizeVisibility(input.visibility) || 'public',
    directoryOptIn: typeof input.directoryOptIn === 'boolean'
      ? input.directoryOptIn
      : typeof input.directory_opt_in === 'boolean'
        ? input.directory_opt_in
        : true,
    emptyStateTitle: sanitizeString(input.emptyStateTitle ?? input.empty_state_title, 120),
    emptyStateDescription: sanitizeString(input.emptyStateDescription ?? input.empty_state_description, 220),
    announcements: sanitizeAnnouncements(input.announcements),
  }
}

export function sanitizeBoardBranding(input: BoardBrandingInput | null | undefined): BoardBranding {
  if (!input) {
    return {
      visibility: 'public',
      directoryOptIn: true,
    }
  }

  return {
    accentColor: sanitizeColor(input.accentColor),
    logoEmoji: sanitizeString(input.logoEmoji, 32),
    heroEyebrow: sanitizeString(input.heroEyebrow, 80),
    heroTitle: sanitizeString(input.heroTitle, 120),
    heroDescription: sanitizeString(input.heroDescription, 280),
    tagline: sanitizeString(input.tagline, 120),
    websiteUrl: sanitizeUrl(input.websiteUrl),
    categories: sanitizeCategories(input.categories),
    visibility: sanitizeVisibility(input.visibility) || 'public',
    directoryOptIn: input.directoryOptIn === false ? false : true,
    emptyStateTitle: sanitizeString(input.emptyStateTitle, 120),
    emptyStateDescription: sanitizeString(input.emptyStateDescription, 220),
    announcements: sanitizeAnnouncements(input.announcements),
  }
}

export function sanitizeBoardAnnouncements(input: unknown): BoardAnnouncement[] {
  return sanitizeAnnouncements(input) || []
}

export function parseBoardBranding(
  input: BoardBrandingSource | Record<string, unknown> | null | undefined,
): BoardBranding {
  const record = asRecord(input)
  if (!record) {
    return {
      visibility: 'public',
      directoryOptIn: true,
    }
  }

  const legacy = parseLegacyBranding(
    record.branding && typeof record.branding === 'object'
      ? (record.branding as Record<string, unknown>)
      : record,
  )

  return sanitizeBoardBranding({
    accentColor: record.accent_color ?? record.accentColor ?? legacy.accentColor,
    logoEmoji: record.logo_emoji ?? record.logoEmoji ?? legacy.logoEmoji,
    heroEyebrow: record.hero_eyebrow ?? record.heroEyebrow ?? legacy.heroEyebrow,
    heroTitle: record.hero_title ?? record.heroTitle ?? legacy.heroTitle,
    heroDescription: record.hero_description ?? record.heroDescription ?? legacy.heroDescription,
    tagline: record.tagline ?? legacy.tagline,
    websiteUrl: record.website_url ?? record.websiteUrl ?? legacy.websiteUrl,
    categories: record.categories ?? legacy.categories,
    visibility: record.visibility ?? legacy.visibility,
    directoryOptIn: record.directory_opt_in ?? record.directoryOptIn ?? legacy.directoryOptIn,
    emptyStateTitle: record.empty_state_title ?? record.emptyStateTitle ?? legacy.emptyStateTitle,
    emptyStateDescription: record.empty_state_description ?? record.emptyStateDescription ?? legacy.emptyStateDescription,
    announcements: record.announcements ?? legacy.announcements,
  })
}

export function boardBrandingToColumns(
  branding: BoardBrandingInput | null | undefined,
): BoardBrandingColumns {
  const sanitized = sanitizeBoardBranding(branding)

  return {
    visibility: sanitized.visibility || 'public',
    directory_opt_in: sanitized.directoryOptIn !== false,
    accent_color: sanitized.accentColor || null,
    logo_emoji: sanitized.logoEmoji || null,
    hero_eyebrow: sanitized.heroEyebrow || null,
    hero_title: sanitized.heroTitle || null,
    hero_description: sanitized.heroDescription || null,
    tagline: sanitized.tagline || null,
    website_url: sanitized.websiteUrl || null,
    categories: sanitized.categories || [],
    empty_state_title: sanitized.emptyStateTitle || null,
    empty_state_description: sanitized.emptyStateDescription || null,
  }
}

export function serializeBoardBranding(
  branding: BoardBrandingInput | null | undefined,
): Record<string, unknown> {
  const sanitized = sanitizeBoardBranding(branding)
  const next: Record<string, unknown> = {}

  if (sanitized.accentColor) next.accentColor = sanitized.accentColor
  if (sanitized.logoEmoji) next.logoEmoji = sanitized.logoEmoji
  if (sanitized.heroEyebrow) next.heroEyebrow = sanitized.heroEyebrow
  if (sanitized.heroTitle) next.heroTitle = sanitized.heroTitle
  if (sanitized.heroDescription) next.heroDescription = sanitized.heroDescription
  if (sanitized.tagline) next.tagline = sanitized.tagline
  if (sanitized.websiteUrl) next.websiteUrl = sanitized.websiteUrl
  if (sanitized.categories?.length) next.categories = sanitized.categories
  if (sanitized.visibility) next.visibility = sanitized.visibility
  if (sanitized.directoryOptIn === false) next.directoryOptIn = false
  if (sanitized.emptyStateTitle) next.emptyStateTitle = sanitized.emptyStateTitle
  if (sanitized.emptyStateDescription) next.emptyStateDescription = sanitized.emptyStateDescription
  if (sanitized.announcements?.length) {
    next.announcements = sanitized.announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      publishedAt: announcement.publishedAt,
      ...(announcement.href ? { href: announcement.href } : {}),
    }))
  }

  return next
}

export function normalizeBoardAnnouncementId(id: string | undefined): string | undefined {
  return id && UUID_RE.test(id) ? id : undefined
}

export function getBoardVisibility(
  input: BoardBrandingSource | Record<string, unknown> | null | undefined,
): BoardVisibility {
  return parseBoardBranding(input).visibility || 'public'
}

export function isBoardPubliclyAccessible(
  input: BoardBrandingSource | Record<string, unknown> | null | undefined,
): boolean {
  return getBoardVisibility(input) !== 'private'
}

export function isBoardListedInDirectory(
  input: BoardBrandingSource | Record<string, unknown> | null | undefined,
): boolean {
  const branding = parseBoardBranding(input)
  return (branding.visibility || 'public') === 'public' && branding.directoryOptIn !== false
}
