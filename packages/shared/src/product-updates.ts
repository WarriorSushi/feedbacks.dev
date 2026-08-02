import type { PublicWidgetConfig } from './widget-install.js'

export type ProductUpdateStatus = 'draft' | 'published' | 'archived'
export type ProductUpdateTheme = 'auto' | 'light' | 'dark'
export type ProductUpdateMetricType = 'impression' | 'dismissal' | 'cta_click'

// These owner-side activation events are intentionally declarative in Phase 0.
// Later phases may emit them through a privacy-preserving aggregate pipeline.
export const PRODUCT_UPDATE_ACTIVATION_EVENTS = [
  'updates_nav_opened',
  'updates_setup_started',
  'updates_install_method_selected',
  'updates_embed_verified',
  'updates_activated',
  'updates_first_draft_created',
  'updates_private_test_opened',
  'updates_first_published',
  'updates_first_impression_received',
] as const

export type ProductUpdateActivationEvent = typeof PRODUCT_UPDATE_ACTIVATION_EVENTS[number]

export const PRODUCT_UPDATE_LIMITS = {
  versionLabel: 32,
  title: 120,
  summary: 280,
  highlights: 8,
  highlight: 160,
  ctaLabel: 40,
  ctaUrl: 2048,
  ctas: 4,
  imageAltText: 160,
  paths: 10,
  path: 120,
  displayDelayMin: 0,
  displayDelayMax: 30_000,
  publicUpdates: 20,
  metricEvents: 10,
  metricBodyBytes: 8 * 1024,
} as const

export interface ProductUpdateCta {
  label: string
  url: string
}

export interface ProductUpdateContent {
  id: string
  versionLabel?: string
  title: string
  summary: string
  highlights: string[]
  imageUrl?: string
  imageAltText?: string
  ctaLabel?: string
  ctaUrl?: string
  ctas?: ProductUpdateCta[]
  publishedAt: string
  expiresAt?: string
}

export interface ProductUpdatePublicSettings {
  autoShow: boolean
  displayDelayMs: number
  theme: ProductUpdateTheme
  accentColor: string
  includePaths: string[]
  excludePaths: string[]
  showPoweredBy: boolean
}

export interface ProductUpdatesPublicResponse {
  settings: ProductUpdatePublicSettings
  updates: ProductUpdateContent[]
}

export interface WidgetBootstrapModules {
  feedback: boolean
  updates: boolean
}

export interface WidgetBootstrapResponse {
  configVersion: 2
  modules: WidgetBootstrapModules
  feedbackConfig: PublicWidgetConfig
  updates?: ProductUpdatesPublicResponse
}

const PUBLIC_WIDGET_CONFIG_KEYS = new Set([
  'configVersion', 'apiUrl', 'updatesApiUrl', 'updatesEventsApiUrl', 'embedMode', 'position', 'target',
  'buttonText', 'primaryColor', 'backgroundColor', 'scale', 'modalWidth', 'debug', 'requireEmail',
  'enableType', 'enableRating', 'enableScreenshot', 'screenshotRequired', 'enableAttachment',
  'attachmentMaxMB', 'allowedAttachmentMimes', 'requireCaptcha', 'captchaProvider', 'turnstileSiteKey',
  'hcaptchaSiteKey', 'formTitle', 'formSubtitle', 'messageLabel', 'messagePlaceholder', 'emailLabel',
  'submitButtonText', 'cancelButtonText', 'successTitle', 'successDescription', 'showPoweredBy', 'openOnKey', 'openAfterMs',
])

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}

function isPublicWidgetConfig(value: unknown): value is PublicWidgetConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const config = value as Record<string, unknown>
  if (Object.keys(config).some((key) => !PUBLIC_WIDGET_CONFIG_KEYS.has(key))) return false
  if (config.configVersion !== 1
    || !isHttpUrl(config.apiUrl)
    || !isHttpUrl(config.updatesApiUrl)
    || !isHttpUrl(config.updatesEventsApiUrl)
    || !['modal', 'inline', 'trigger'].includes(config.embedMode as string)
    || !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.position as string)) return false

  const stringFields = ['target', 'buttonText', 'primaryColor', 'backgroundColor', 'captchaProvider', 'turnstileSiteKey', 'hcaptchaSiteKey', 'formTitle', 'formSubtitle', 'messageLabel', 'messagePlaceholder', 'emailLabel', 'submitButtonText', 'cancelButtonText', 'successTitle', 'successDescription', 'openOnKey']
  const booleanFields = ['debug', 'requireEmail', 'enableType', 'enableRating', 'enableScreenshot', 'screenshotRequired', 'enableAttachment', 'requireCaptcha', 'showPoweredBy']
  const numberFields = ['scale', 'modalWidth', 'attachmentMaxMB', 'openAfterMs']
  if (stringFields.some((field) => config[field] !== undefined && typeof config[field] !== 'string')) return false
  if (booleanFields.some((field) => config[field] !== undefined && typeof config[field] !== 'boolean')) return false
  if (numberFields.some((field) => config[field] !== undefined && (typeof config[field] !== 'number' || !Number.isFinite(config[field])))) return false
  if (config.allowedAttachmentMimes !== undefined
    && (!Array.isArray(config.allowedAttachmentMimes) || config.allowedAttachmentMimes.some((mime) => typeof mime !== 'string'))) return false
  if (config.captchaProvider !== undefined && !['turnstile', 'hcaptcha'].includes(config.captchaProvider as string)) return false
  if (config.primaryColor !== undefined && (typeof config.primaryColor !== 'string' || !HEX_COLOR_RE.test(config.primaryColor))) return false
  if (config.backgroundColor !== undefined && (typeof config.backgroundColor !== 'string' || !HEX_COLOR_RE.test(config.backgroundColor))) return false
  if (typeof config.scale === 'number' && (config.scale < 0.5 || config.scale > 2)) return false
  if (typeof config.modalWidth === 'number' && (!Number.isInteger(config.modalWidth) || config.modalWidth < 320 || config.modalWidth > 960)) return false
  if (typeof config.attachmentMaxMB === 'number' && (!Number.isInteger(config.attachmentMaxMB) || config.attachmentMaxMB < 1 || config.attachmentMaxMB > 50)) return false
  if (typeof config.openAfterMs === 'number' && (!Number.isInteger(config.openAfterMs) || config.openAfterMs < 0 || config.openAfterMs > 600_000)) return false
  return true
}

/**
 * Keep the widget's public bootstrap parsing deliberately small and defensive.
 * An invalid bootstrap response must behave exactly like an unavailable one so
 * that an embed never loses its existing feedback launcher because of a bad
 * response at the edge.
 */
export function isWidgetBootstrapResponse(value: unknown): value is WidgetBootstrapResponse {
  if (!value || typeof value !== 'object') return false
  const response = value as Partial<WidgetBootstrapResponse>
  if (response.configVersion !== 2 || !response.modules || !isPublicWidgetConfig(response.feedbackConfig)) return false
  if (typeof response.modules.feedback !== 'boolean' || typeof response.modules.updates !== 'boolean') return false
  if (!response.modules.updates) return response.updates === undefined
  if (!response.updates || !isProductUpdatesPublicResponse(response.updates)) return false
  return true
}

function isProductUpdatesPublicResponse(value: unknown): value is ProductUpdatesPublicResponse {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<ProductUpdatesPublicResponse>
  const settings = payload.settings
  if (!settings || typeof settings !== 'object' || !Array.isArray(payload.updates)) return false
  if (typeof settings.autoShow !== 'boolean'
    || typeof settings.displayDelayMs !== 'number'
    || !Number.isInteger(settings.displayDelayMs)
    || settings.displayDelayMs < PRODUCT_UPDATE_LIMITS.displayDelayMin
    || settings.displayDelayMs > PRODUCT_UPDATE_LIMITS.displayDelayMax
    || !['auto', 'light', 'dark'].includes(settings.theme)
    || typeof settings.accentColor !== 'string'
    || !HEX_COLOR_RE.test(settings.accentColor)
    || !Array.isArray(settings.includePaths)
    || !Array.isArray(settings.excludePaths)
    || typeof settings.showPoweredBy !== 'boolean') return false

  if (settings.includePaths.some((path) => !sanitizeProductUpdatePath(path))
    || settings.excludePaths.some((path) => !sanitizeProductUpdatePath(path))) return false

  return payload.updates.every((update) => {
    if (!update || typeof update !== 'object') return false
    const item = update as Partial<ProductUpdateContent>
    return typeof item.id === 'string'
      && typeof item.title === 'string'
      && typeof item.summary === 'string'
      && Array.isArray(item.highlights)
      && item.highlights.every((highlight) => typeof highlight === 'string')
      && typeof item.publishedAt === 'string'
      && !Number.isNaN(new Date(item.publishedAt).getTime())
  })
}

export interface ProductUpdateInput {
  versionLabel?: string
  title?: string
  summary?: string
  highlights?: string[]
  ctaLabel?: string
  ctaUrl?: string
  ctas?: ProductUpdateCta[]
  imageAltText?: string
  publishedAt?: string
  expiresAt?: string
}

export interface ProductUpdateSettingsInput {
  enabled?: boolean
  autoShow?: boolean
  displayDelayMs?: number
  theme?: ProductUpdateTheme
  accentColor?: string
  includePaths?: string[]
  excludePaths?: string[]
  showPoweredBy?: boolean
}

export interface ProductUpdateValidationResult<T> {
  data: T
  errors: Record<string, string>
}

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const PATH_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%\-/]*$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function optionalText(value: unknown, limit: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > limit) return undefined
  return trimmed
}

function parseIso(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function sanitizeProductUpdateCta(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > PRODUCT_UPDATE_LIMITS.ctaUrl) return undefined
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

export function sanitizeProductUpdateInput(
  input: unknown,
  options: { requirePublishFields?: boolean } = {},
): ProductUpdateValidationResult<ProductUpdateInput> {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const errors: Record<string, string> = {}
  const versionLabel = optionalText(source.versionLabel, PRODUCT_UPDATE_LIMITS.versionLabel)
  const title = optionalText(source.title, PRODUCT_UPDATE_LIMITS.title)
  const summary = optionalText(source.summary, PRODUCT_UPDATE_LIMITS.summary)
  const imageAltText = optionalText(source.imageAltText, PRODUCT_UPDATE_LIMITS.imageAltText)

  if (typeof source.versionLabel === 'string' && source.versionLabel.trim() && !versionLabel) errors.versionLabel = 'Version label must be 1–32 characters.'
  if ((options.requirePublishFields || source.title !== undefined) && !title) errors.title = 'Title must be 1–120 characters.'
  if ((options.requirePublishFields || source.summary !== undefined) && !summary) errors.summary = 'Summary must be 1–280 characters.'
  if (typeof source.imageAltText === 'string' && source.imageAltText.trim() && !imageAltText) {
    errors.imageAltText = `Image description must be ${PRODUCT_UPDATE_LIMITS.imageAltText} characters or fewer.`
  }

  const rawHighlights = source.highlights
  const highlights = Array.isArray(rawHighlights)
    ? rawHighlights.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
    : []
  if (rawHighlights !== undefined && (!Array.isArray(rawHighlights) || highlights.length > PRODUCT_UPDATE_LIMITS.highlights || highlights.some((item) => !item || item.length > PRODUCT_UPDATE_LIMITS.highlight))) {
    errors.highlights = `Use up to ${PRODUCT_UPDATE_LIMITS.highlights} highlights of up to ${PRODUCT_UPDATE_LIMITS.highlight} characters.`
  }

  const ctaLabel = optionalText(source.ctaLabel, PRODUCT_UPDATE_LIMITS.ctaLabel)
  const ctaUrl = sanitizeProductUpdateCta(source.ctaUrl)
  const rawCtaLabel = typeof source.ctaLabel === 'string' && source.ctaLabel.trim()
  const rawCtaUrl = typeof source.ctaUrl === 'string' && source.ctaUrl.trim()
  if ((rawCtaLabel && !ctaLabel) || (rawCtaUrl && !ctaUrl) || Boolean(ctaLabel) !== Boolean(ctaUrl)) {
    errors.cta = 'CTA label and a safe relative or HTTP(S) URL are both required.'
  }
  const rawCtas = source.ctas
  const ctas = Array.isArray(rawCtas)
    ? rawCtas.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const candidate = item as Record<string, unknown>
        const label = optionalText(candidate.label, PRODUCT_UPDATE_LIMITS.ctaLabel)
        const url = sanitizeProductUpdateCta(candidate.url)
        return label && url ? [{ label, url }] : []
      })
    : []
  if (
    rawCtas !== undefined
    && (!Array.isArray(rawCtas)
      || rawCtas.length > PRODUCT_UPDATE_LIMITS.ctas
      || ctas.length !== rawCtas.length)
  ) {
    errors.ctas = `Use up to ${PRODUCT_UPDATE_LIMITS.ctas} buttons. Every button needs a label and a safe relative or HTTP(S) URL.`
  }

  const publishedAt = parseIso(source.publishedAt)
  const expiresAt = parseIso(source.expiresAt)
  if (source.publishedAt !== undefined && !publishedAt) errors.publishedAt = 'Publish time must be a valid ISO timestamp.'
  if (source.expiresAt !== undefined && !expiresAt) errors.expiresAt = 'Expiry time must be a valid ISO timestamp.'
  if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt)) errors.expiresAt = 'Expiry must be later than publication.'

  return {
    data: {
      ...(versionLabel ? { versionLabel } : {}),
      ...(title ? { title } : {}),
      ...(summary ? { summary } : {}),
      highlights: errors.highlights ? [] : highlights,
      ...(ctaLabel && ctaUrl ? { ctaLabel, ctaUrl } : {}),
      ...(rawCtas !== undefined && !errors.ctas ? { ctas } : {}),
      ...(imageAltText ? { imageAltText } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    },
    errors,
  }
}

export function sanitizeProductUpdatePath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const path = value.trim()
  if (!path || path.length > PRODUCT_UPDATE_LIMITS.path || !PATH_RE.test(path) || path.includes('?') || path.includes('#') || path.includes('//')) return undefined
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function sanitizePaths(value: unknown, field: string, errors: Record<string, string>): string[] {
  if (!Array.isArray(value) || value.length > PRODUCT_UPDATE_LIMITS.paths) {
    errors[field] = `Use up to ${PRODUCT_UPDATE_LIMITS.paths} path prefixes.`
    return []
  }
  const paths = value.map(sanitizeProductUpdatePath)
  if (paths.some((path) => !path)) {
    errors[field] = 'Each path must be a pathname prefix beginning with /.'
    return []
  }
  return [...new Set(paths as string[])]
}

export function sanitizeProductUpdateSettings(input: unknown): ProductUpdateValidationResult<ProductUpdateSettingsInput> {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const errors: Record<string, string> = {}
  const displayDelayMs = typeof source.displayDelayMs === 'number' && Number.isInteger(source.displayDelayMs)
    && source.displayDelayMs >= PRODUCT_UPDATE_LIMITS.displayDelayMin && source.displayDelayMs <= PRODUCT_UPDATE_LIMITS.displayDelayMax
    ? source.displayDelayMs
    : undefined
  if (source.displayDelayMs !== undefined && displayDelayMs === undefined) errors.displayDelayMs = 'Delay must be between 0 and 30000 milliseconds.'
  const theme = ['auto', 'light', 'dark'].includes(source.theme as string) ? source.theme as ProductUpdateTheme : undefined
  if (source.theme !== undefined && !theme) errors.theme = 'Theme must be auto, light, or dark.'
  const accentColor = typeof source.accentColor === 'string' && HEX_COLOR_RE.test(source.accentColor.trim()) ? source.accentColor.trim() : undefined
  if (source.accentColor !== undefined && !accentColor) errors.accentColor = 'Accent color must be a 3 or 6 digit hex color.'

  return {
    data: {
      ...(typeof source.enabled === 'boolean' ? { enabled: source.enabled } : {}),
      ...(typeof source.autoShow === 'boolean' ? { autoShow: source.autoShow } : {}),
      ...(displayDelayMs !== undefined ? { displayDelayMs } : {}),
      ...(theme ? { theme } : {}),
      ...(accentColor ? { accentColor } : {}),
      ...(source.includePaths !== undefined ? { includePaths: sanitizePaths(source.includePaths, 'includePaths', errors) } : {}),
      ...(source.excludePaths !== undefined ? { excludePaths: sanitizePaths(source.excludePaths, 'excludePaths', errors) } : {}),
      ...(typeof source.showPoweredBy === 'boolean' ? { showPoweredBy: source.showPoweredBy } : {}),
    },
    errors,
  }
}

export function deriveProductUpdateState(update: Pick<ProductUpdateContent, 'publishedAt' | 'expiresAt'> & { status: ProductUpdateStatus }, now = new Date()): 'Draft' | 'Scheduled' | 'Live' | 'Expired' | 'Archived' {
  if (update.status === 'archived') return 'Archived'
  if (update.status !== 'published') return 'Draft'
  if (update.expiresAt && new Date(update.expiresAt) <= now) return 'Expired'
  if (new Date(update.publishedAt) > now) return 'Scheduled'
  return 'Live'
}

export function isProductUpdateLive(update: Pick<ProductUpdateContent, 'publishedAt' | 'expiresAt'> & { status: ProductUpdateStatus }, now = new Date()): boolean {
  return deriveProductUpdateState(update, now) === 'Live'
}

function prefixMatches(pathname: string, prefix: string): boolean {
  return prefix === '/' || pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isProductUpdatePathEligible(pathname: string, settings: Pick<ProductUpdatePublicSettings, 'includePaths' | 'excludePaths'>): boolean {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (settings.excludePaths.some((prefix) => prefixMatches(path, prefix))) return false
  return settings.includePaths.length === 0 || settings.includePaths.some((prefix) => prefixMatches(path, prefix))
}

export function isProductUpdateId(value: string): boolean {
  return UUID_RE.test(value)
}

function normalizeOrigin(origin?: string): string {
  return (origin || 'https://app.feedbacks.dev').trim().replace(/\/+$/, '')
}

export function buildProductUpdatesApiUrl(origin?: string): string {
  return `${normalizeOrigin(origin)}/api/widget/updates`
}

export function buildProductUpdateMetricsApiUrl(origin?: string): string {
  return `${normalizeOrigin(origin)}/api/widget/updates/events`
}
