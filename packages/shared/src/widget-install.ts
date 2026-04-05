export type EmbedMode = 'modal' | 'inline' | 'trigger'
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
export type CaptchaProvider = 'turnstile' | 'hcaptcha'
export const WIDGET_CONFIG_VERSION = 1

export interface SavedWidgetConfig {
  configVersion?: number
  apiUrl?: string
  embedMode?: EmbedMode
  position?: WidgetPosition
  target?: string
  buttonText?: string
  primaryColor?: string
  backgroundColor?: string
  scale?: number
  modalWidth?: number
  debug?: boolean
  requireEmail?: boolean
  enableType?: boolean
  enableRating?: boolean
  enableScreenshot?: boolean
  screenshotRequired?: boolean
  enableAttachment?: boolean
  attachmentMaxMB?: number
  allowedAttachmentMimes?: string[]
  requireCaptcha?: boolean
  captchaProvider?: CaptchaProvider
  turnstileSiteKey?: string
  hcaptchaSiteKey?: string
  formTitle?: string
  formSubtitle?: string
  messageLabel?: string
  messagePlaceholder?: string
  emailLabel?: string
  submitButtonText?: string
  cancelButtonText?: string
  successTitle?: string
  successDescription?: string
  openOnKey?: string
  openAfterMs?: number
}

export interface WidgetConfig extends SavedWidgetConfig {
  projectKey: string
}

export interface WidgetScriptAttribute {
  name: string
  value?: string
}

export interface WidgetDataAttributesInput {
  project?: string
  configVersion?: string
  embedMode?: string
  target?: string
  position?: string
  buttonText?: string
  color?: string
  bg?: string
  scale?: string
  modalWidth?: string
  apiUrl?: string
  debug?: string
  requireEmail?: string
  requireCaptcha?: string
  captchaProvider?: string
  turnstileSiteKey?: string
  hcaptchaSiteKey?: string
  enableType?: string
  enableRating?: string
  enableScreenshot?: string
  screenshotRequired?: string
  enableAttachment?: string
  attachmentMaxMB?: string
  attachmentMimes?: string
  formTitle?: string
  formSubtitle?: string
  messageLabel?: string
  messagePlaceholder?: string
  emailLabel?: string
  submitText?: string
  cancelText?: string
  successTitle?: string
  successDescription?: string
  openKey?: string
  openAfter?: string
}

export interface WidgetAttributePresence {
  debug?: boolean
  requireEmail?: boolean
  requireCaptcha?: boolean
  enableScreenshot?: boolean
  screenshotRequired?: boolean
  enableAttachment?: boolean
}

export interface GenerateInstallSnippetsInput {
  projectKey: string
  savedConfig?: SavedWidgetConfig | null
  appOrigin?: string
}

export interface InstallSnippet {
  label: 'Website' | 'React' | 'Vue'
  language: 'html' | 'tsx' | 'vue'
  code: string
}

const DEFAULT_APP_ORIGIN = 'https://app.feedbacks.dev'
const DEFAULT_INLINE_TARGET_PREFIX = 'feedbacks-inline'
const DEFAULT_TRIGGER_TARGET_PREFIX = 'feedbacks-trigger'
const DEFAULT_MODAL_POSITION: WidgetPosition = 'bottom-right'
const DEFAULT_MODAL_MODE: EmbedMode = 'modal'
const DEFAULT_BUTTON_TEXT = 'Feedback'
const DEFAULT_PRIMARY_COLOR = '#6366f1'
const DEFAULT_FORM_TITLE = 'Send Feedback'
const DEFAULT_MESSAGE_PLACEHOLDER = "What's on your mind?"
const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const MIME_TYPE_RE = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i

const EMBED_MODES: readonly EmbedMode[] = ['modal', 'inline', 'trigger']
const POSITIONS: readonly WidgetPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
const CAPTCHA_PROVIDERS: readonly CaptchaProvider[] = ['turnstile', 'hcaptcha']

function sanitizeSuffix(projectKey: string): string {
  const suffix = projectKey.replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(-10)
  return suffix || 'widget'
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  options: { round?: boolean; precision?: number } = {},
): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  const bounded = Math.min(max, Math.max(min, value))
  if (options.round) return Math.round(bounded)
  if (typeof options.precision === 'number') {
    return Number(bounded.toFixed(options.precision))
  }
  return bounded
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function sanitizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function sanitizeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
    return stripTrailingSlash(parsed.toString())
  } catch {
    return undefined
  }
}

function sanitizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return HEX_COLOR_RE.test(trimmed) ? trimmed : undefined
}

function sanitizeMimeTypes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const sanitized = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => MIME_TYPE_RE.test(entry))
    .slice(0, 12)

  return sanitized.length > 0 ? sanitized : undefined
}

function sanitizeBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function quoteString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function isPresent(value: string | undefined, presence = false): boolean {
  return value === 'true' || (presence && value !== 'false')
}

function readNumber(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeMode(value?: string): EmbedMode | undefined {
  return EMBED_MODES.includes(value as EmbedMode) ? (value as EmbedMode) : undefined
}

function normalizePosition(value?: string): WidgetPosition | undefined {
  return POSITIONS.includes(value as WidgetPosition) ? (value as WidgetPosition) : undefined
}

function normalizeCaptchaProvider(value?: string): CaptchaProvider | undefined {
  return CAPTCHA_PROVIDERS.includes(value as CaptchaProvider) ? (value as CaptchaProvider) : undefined
}

export function sanitizeSavedWidgetConfig(
  input: SavedWidgetConfig | null | undefined,
  options: { projectKey?: string; appOrigin?: string } = {},
): SavedWidgetConfig {
  if (!input || typeof input !== 'object') {
    return { configVersion: WIDGET_CONFIG_VERSION }
  }

  const embedMode = normalizeMode(input.embedMode) || DEFAULT_MODAL_MODE
  const target = embedMode === 'modal'
    ? undefined
    : normalizeWidgetTarget(
        sanitizeText(input.target, 120),
        getDefaultWidgetTarget(embedMode, options.projectKey || 'feedbacks') || '#feedbacks-widget',
      )
  const sanitized: SavedWidgetConfig = {
    configVersion: WIDGET_CONFIG_VERSION,
    apiUrl: sanitizeUrl(input.apiUrl),
    embedMode,
    position: normalizePosition(input.position) || DEFAULT_MODAL_POSITION,
    target,
    buttonText: sanitizeText(input.buttonText, 80),
    primaryColor: sanitizeColor(input.primaryColor),
    backgroundColor: sanitizeColor(input.backgroundColor),
    scale: clampNumber(input.scale, 0.5, 2, { precision: 2 }),
    modalWidth: clampNumber(input.modalWidth, 320, 960, { round: true }),
    debug: sanitizeBoolean(input.debug),
    requireEmail: sanitizeBoolean(input.requireEmail),
    enableType: sanitizeBoolean(input.enableType),
    enableRating: sanitizeBoolean(input.enableRating),
    enableScreenshot: sanitizeBoolean(input.enableScreenshot),
    screenshotRequired: sanitizeBoolean(input.screenshotRequired),
    enableAttachment: sanitizeBoolean(input.enableAttachment),
    attachmentMaxMB: clampNumber(input.attachmentMaxMB, 1, 50, { round: true }),
    allowedAttachmentMimes: sanitizeMimeTypes(input.allowedAttachmentMimes),
    requireCaptcha: sanitizeBoolean(input.requireCaptcha),
    captchaProvider: normalizeCaptchaProvider(input.captchaProvider),
    turnstileSiteKey: sanitizeText(input.turnstileSiteKey, 200),
    hcaptchaSiteKey: sanitizeText(input.hcaptchaSiteKey, 200),
    formTitle: sanitizeText(input.formTitle, 120),
    formSubtitle: sanitizeText(input.formSubtitle, 240),
    messageLabel: sanitizeText(input.messageLabel, 80),
    messagePlaceholder: sanitizeText(input.messagePlaceholder, 280),
    emailLabel: sanitizeText(input.emailLabel, 80),
    submitButtonText: sanitizeText(input.submitButtonText, 80),
    cancelButtonText: sanitizeText(input.cancelButtonText, 80),
    successTitle: sanitizeText(input.successTitle, 120),
    successDescription: sanitizeText(input.successDescription, 240),
    openOnKey: sanitizeText(input.openOnKey, 32),
    openAfterMs: clampNumber(input.openAfterMs, 0, 600000, { round: true }),
  }

  if (!sanitized.requireCaptcha) {
    delete sanitized.captchaProvider
    delete sanitized.turnstileSiteKey
    delete sanitized.hcaptchaSiteKey
  }

  if (!sanitized.enableAttachment) {
    delete sanitized.attachmentMaxMB
    delete sanitized.allowedAttachmentMimes
  }

  if (!sanitized.enableScreenshot) {
    delete sanitized.screenshotRequired
  }

  return Object.fromEntries(
    Object.entries(sanitized).filter(([, value]) => value !== undefined),
  ) as SavedWidgetConfig
}

export function normalizeAppOrigin(appOrigin?: string): string {
  return stripTrailingSlash(appOrigin?.trim() || DEFAULT_APP_ORIGIN)
}

export function buildWidgetScriptUrl(appOrigin?: string): string {
  return `${normalizeAppOrigin(appOrigin)}/widget/latest.js`
}

export function buildFeedbackApiUrl(appOrigin?: string): string {
  return `${normalizeAppOrigin(appOrigin)}/api/feedback`
}

export function normalizeWidgetTarget(target: string | undefined, fallback: string): string {
  const trimmed = target?.trim()
  if (!trimmed || trimmed === '#') return fallback
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

export function getDefaultWidgetTarget(mode: EmbedMode, projectKey: string): string | undefined {
  const suffix = sanitizeSuffix(projectKey)
  if (mode === 'inline') return `#${DEFAULT_INLINE_TARGET_PREFIX}-${suffix}`
  if (mode === 'trigger') return `#${DEFAULT_TRIGGER_TARGET_PREFIX}-${suffix}`
  return undefined
}

export function buildRuntimeWidgetConfig(
  projectKey: string,
  savedConfig: SavedWidgetConfig | null | undefined = {},
  options: { appOrigin?: string; apiUrl?: string } = {},
): WidgetConfig {
  const sanitizedConfig = sanitizeSavedWidgetConfig(savedConfig, {
    projectKey,
    appOrigin: options.appOrigin,
  })
  const mode = sanitizedConfig.embedMode || DEFAULT_MODAL_MODE
  const fallbackTarget = getDefaultWidgetTarget(mode, projectKey)
  const nextTarget = mode === 'modal'
    ? undefined
    : normalizeWidgetTarget(sanitizedConfig.target, fallbackTarget || '#feedbacks-widget')

  return {
    ...sanitizedConfig,
    projectKey,
    embedMode: mode,
    position: sanitizedConfig.position || DEFAULT_MODAL_POSITION,
    target: nextTarget,
    apiUrl: options.apiUrl || sanitizedConfig.apiUrl || buildFeedbackApiUrl(options.appOrigin),
  }
}

export function buildWidgetEditorConfig(
  projectKey: string,
  savedConfig: SavedWidgetConfig | null | undefined = {},
  options: { appOrigin?: string } = {},
): SavedWidgetConfig {
  const sanitizedConfig = sanitizeSavedWidgetConfig(savedConfig, {
    projectKey,
    appOrigin: options.appOrigin,
  })
  const runtimeConfig = buildRuntimeWidgetConfig(projectKey, sanitizedConfig, {
    appOrigin: options.appOrigin,
  })

  return {
    ...sanitizedConfig,
    configVersion: runtimeConfig.configVersion || WIDGET_CONFIG_VERSION,
    embedMode: runtimeConfig.embedMode || DEFAULT_MODAL_MODE,
    position: runtimeConfig.position || DEFAULT_MODAL_POSITION,
    buttonText: runtimeConfig.buttonText || DEFAULT_BUTTON_TEXT,
    primaryColor: runtimeConfig.primaryColor || DEFAULT_PRIMARY_COLOR,
    enableType: runtimeConfig.enableType ?? true,
    enableRating: runtimeConfig.enableRating ?? true,
    enableScreenshot: runtimeConfig.enableScreenshot ?? false,
    requireEmail: runtimeConfig.requireEmail ?? false,
    formTitle: runtimeConfig.formTitle || DEFAULT_FORM_TITLE,
    messagePlaceholder: runtimeConfig.messagePlaceholder || DEFAULT_MESSAGE_PLACEHOLDER,
  }
}

export function getWidgetModeLabel(
  config: Pick<SavedWidgetConfig, 'embedMode'> | Pick<WidgetConfig, 'embedMode'>,
): string {
  return config.embedMode === 'inline'
    ? 'Inline'
    : config.embedMode === 'trigger'
      ? 'Trigger'
      : 'Modal'
}

export function getWidgetLauncherPositionLabel(
  position?: WidgetPosition,
): string {
  switch (position) {
    case 'bottom-left':
      return 'lower-left corner'
    case 'top-left':
      return 'upper-left corner'
    case 'top-right':
      return 'upper-right corner'
    default:
      return 'lower-right corner'
  }
}

export function getWidgetExpectation(
  config: Pick<SavedWidgetConfig, 'embedMode' | 'position' | 'buttonText'> | Pick<WidgetConfig, 'embedMode' | 'position' | 'buttonText'>,
): string {
  const buttonText = config.buttonText?.trim() || DEFAULT_BUTTON_TEXT

  if (config.embedMode === 'inline') {
    return 'The widget renders directly inside the inline mount element.'
  }

  if (config.embedMode === 'trigger') {
    return `Click "${buttonText}" to open the feedback form from your trigger element.`
  }

  return `Look for the floating "${buttonText}" launcher near the ${getWidgetLauncherPositionLabel(config.position)}.`
}

export function parseWidgetDataAttributes(
  input: WidgetDataAttributesInput,
  presence: WidgetAttributePresence = {},
): WidgetConfig | null {
  if (!input.project) return null

  const config = sanitizeSavedWidgetConfig(
    {
      embedMode: input.embedMode as EmbedMode | undefined,
      configVersion: readNumber(input.configVersion),
      position: input.position as WidgetPosition | undefined,
      target: input.target || undefined,
      buttonText: input.buttonText || undefined,
      primaryColor: input.color || undefined,
      backgroundColor: input.bg || undefined,
      scale: readNumber(input.scale),
      modalWidth: readNumber(input.modalWidth),
      apiUrl: input.apiUrl || undefined,
      debug: isPresent(input.debug, presence.debug),
      requireEmail: isPresent(input.requireEmail, presence.requireEmail),
      requireCaptcha: isPresent(input.requireCaptcha, presence.requireCaptcha),
      captchaProvider: input.captchaProvider as CaptchaProvider | undefined,
      turnstileSiteKey: input.turnstileSiteKey || undefined,
      hcaptchaSiteKey: input.hcaptchaSiteKey || undefined,
      enableType: input.enableType !== 'false',
      enableRating: input.enableRating !== 'false',
      enableScreenshot: isPresent(input.enableScreenshot, presence.enableScreenshot),
      screenshotRequired: isPresent(input.screenshotRequired, presence.screenshotRequired),
      enableAttachment: isPresent(input.enableAttachment, presence.enableAttachment),
      attachmentMaxMB: readNumber(input.attachmentMaxMB),
      allowedAttachmentMimes: input.attachmentMimes
        ? input.attachmentMimes.split(',').map((value) => value.trim()).filter(Boolean)
        : undefined,
      formTitle: input.formTitle || undefined,
      formSubtitle: input.formSubtitle || undefined,
      messageLabel: input.messageLabel || undefined,
      messagePlaceholder: input.messagePlaceholder || undefined,
      emailLabel: input.emailLabel || undefined,
      submitButtonText: input.submitText || undefined,
      cancelButtonText: input.cancelText || undefined,
      successTitle: input.successTitle || undefined,
      successDescription: input.successDescription || undefined,
      openOnKey: input.openKey || undefined,
      openAfterMs: readNumber(input.openAfter),
    },
    { projectKey: input.project },
  )

  return buildRuntimeWidgetConfig(input.project, config, {
    apiUrl: config.apiUrl,
  })
}

export function getWidgetScriptAttributes(config: WidgetConfig): WidgetScriptAttribute[] {
  const attributes: WidgetScriptAttribute[] = [
    { name: 'data-project', value: config.projectKey },
    { name: 'data-api-url', value: config.apiUrl },
    { name: 'data-config-version', value: String(config.configVersion || WIDGET_CONFIG_VERSION) },
  ]

  if (config.embedMode && config.embedMode !== DEFAULT_MODAL_MODE) {
    attributes.push({ name: 'data-embed-mode', value: config.embedMode })
  }
  if (config.target && config.embedMode && config.embedMode !== 'modal') {
    attributes.push({ name: 'data-target', value: config.target })
  }
  if (config.position && config.position !== DEFAULT_MODAL_POSITION) {
    attributes.push({ name: 'data-position', value: config.position })
  }
  if (config.buttonText && config.buttonText !== DEFAULT_BUTTON_TEXT) {
    attributes.push({ name: 'data-button-text', value: config.buttonText })
  }
  if (config.primaryColor) attributes.push({ name: 'data-color', value: config.primaryColor })
  if (config.backgroundColor) attributes.push({ name: 'data-bg', value: config.backgroundColor })
  if (typeof config.scale === 'number') attributes.push({ name: 'data-scale', value: String(config.scale) })
  if (typeof config.modalWidth === 'number') attributes.push({ name: 'data-modal-width', value: String(config.modalWidth) })
  if (config.debug) attributes.push({ name: 'data-debug', value: 'true' })
  if (config.requireEmail) attributes.push({ name: 'data-require-email', value: 'true' })
  if (config.requireCaptcha) attributes.push({ name: 'data-require-captcha', value: 'true' })
  if (config.captchaProvider) attributes.push({ name: 'data-captcha-provider', value: config.captchaProvider })
  if (config.turnstileSiteKey) attributes.push({ name: 'data-turnstile-sitekey', value: config.turnstileSiteKey })
  if (config.hcaptchaSiteKey) attributes.push({ name: 'data-hcaptcha-sitekey', value: config.hcaptchaSiteKey })
  if (config.enableType === false) attributes.push({ name: 'data-enable-type', value: 'false' })
  if (config.enableRating === false) attributes.push({ name: 'data-enable-rating', value: 'false' })
  if (config.enableScreenshot) attributes.push({ name: 'data-enable-screenshot', value: 'true' })
  if (config.screenshotRequired) attributes.push({ name: 'data-screenshot-required', value: 'true' })
  if (config.enableAttachment) attributes.push({ name: 'data-enable-attachment', value: 'true' })
  if (typeof config.attachmentMaxMB === 'number') attributes.push({ name: 'data-attachment-maxmb', value: String(config.attachmentMaxMB) })
  if (config.allowedAttachmentMimes?.length) attributes.push({ name: 'data-attachment-mimes', value: config.allowedAttachmentMimes.join(',') })
  if (config.formTitle) attributes.push({ name: 'data-form-title', value: config.formTitle })
  if (config.formSubtitle) attributes.push({ name: 'data-form-subtitle', value: config.formSubtitle })
  if (config.messageLabel) attributes.push({ name: 'data-message-label', value: config.messageLabel })
  if (config.messagePlaceholder) attributes.push({ name: 'data-message-placeholder', value: config.messagePlaceholder })
  if (config.emailLabel) attributes.push({ name: 'data-email-label', value: config.emailLabel })
  if (config.submitButtonText) attributes.push({ name: 'data-submit-text', value: config.submitButtonText })
  if (config.cancelButtonText) attributes.push({ name: 'data-cancel-text', value: config.cancelButtonText })
  if (config.successTitle) attributes.push({ name: 'data-success-title', value: config.successTitle })
  if (config.successDescription) attributes.push({ name: 'data-success-description', value: config.successDescription })
  if (config.openOnKey) attributes.push({ name: 'data-open-key', value: config.openOnKey })
  if (typeof config.openAfterMs === 'number') attributes.push({ name: 'data-open-after', value: String(config.openAfterMs) })

  return attributes.filter((attribute) => typeof attribute.value === 'string' && attribute.value.length > 0)
}

function buildWebsiteMarkup(config: WidgetConfig): string[] {
  const lines: string[] = []
  if (config.embedMode === 'inline' && config.target) {
    lines.push(`<div id="${config.target.replace(/^#/, '')}"></div>`, '')
  }
  if (config.embedMode === 'trigger' && config.target) {
    lines.push(`<button id="${config.target.replace(/^#/, '')}" type="button">${config.buttonText || DEFAULT_BUTTON_TEXT}</button>`, '')
  }
  return lines
}

function formatWebsiteSnippet(config: WidgetConfig, appOrigin?: string): string {
  const lines = buildWebsiteMarkup(config)
  const attributes = getWidgetScriptAttributes(config)

  lines.push('<script')
  lines.push(`  src="${buildWidgetScriptUrl(appOrigin)}"`)
  attributes.forEach((attribute) => {
    lines.push(`  ${attribute.name}="${attribute.value}"`)
  })
  lines.push('  defer')
  lines.push('></script>')

  return lines.join('\n')
}

function formatReactValue(value: string | number | boolean | string[]): string {
  if (Array.isArray(value)) {
    return `{[${value.map((item) => `"${quoteString(item)}"`).join(', ')}]}`
  }
  if (typeof value === 'string') return `"${quoteString(value)}"`
  if (typeof value === 'number') return `{${value}}`
  return value ? '{true}' : '{false}'
}

function formatVueProp(key: string, value: string | number | boolean | string[]): string {
  const propName = toKebabCase(key)

  if (Array.isArray(value)) {
    return `    :${propName}='${JSON.stringify(value)}'`
  }
  if (typeof value === 'string') {
    return `    ${propName}="${quoteString(value)}"`
  }

  return `    :${propName}="${String(value)}"`
}

function getWrapperPropEntries(config: WidgetConfig, appOrigin?: string): Array<[string, string | number | boolean | string[]]> {
  const entries: Array<[string, string | number | boolean | string[]]> = [
    ['projectKey', config.projectKey],
    ['appOrigin', normalizeAppOrigin(appOrigin)],
    ['apiUrl', config.apiUrl || buildFeedbackApiUrl(appOrigin)],
  ]
  const defaultTarget = config.embedMode
    ? getDefaultWidgetTarget(config.embedMode, config.projectKey)
    : undefined

  if (config.embedMode && config.embedMode !== DEFAULT_MODAL_MODE) entries.push(['embedMode', config.embedMode])
  if (config.position && config.position !== DEFAULT_MODAL_POSITION) entries.push(['position', config.position])
  if (config.target && config.target !== defaultTarget) entries.push(['target', config.target])
  if (config.buttonText && config.buttonText !== DEFAULT_BUTTON_TEXT) entries.push(['buttonText', config.buttonText])
  if (config.primaryColor) entries.push(['primaryColor', config.primaryColor])
  if (config.backgroundColor) entries.push(['backgroundColor', config.backgroundColor])
  if (typeof config.scale === 'number') entries.push(['scale', config.scale])
  if (typeof config.modalWidth === 'number') entries.push(['modalWidth', config.modalWidth])
  if (config.debug) entries.push(['debug', true])
  if (config.requireEmail) entries.push(['requireEmail', true])
  if (config.enableType === false) entries.push(['enableType', false])
  if (config.enableRating === false) entries.push(['enableRating', false])
  if (config.enableScreenshot) entries.push(['enableScreenshot', true])
  if (config.screenshotRequired) entries.push(['screenshotRequired', true])
  if (config.enableAttachment) entries.push(['enableAttachment', true])
  if (typeof config.attachmentMaxMB === 'number') entries.push(['attachmentMaxMB', config.attachmentMaxMB])
  if (config.allowedAttachmentMimes?.length) entries.push(['allowedAttachmentMimes', config.allowedAttachmentMimes])
  if (config.requireCaptcha) entries.push(['requireCaptcha', true])
  if (config.captchaProvider) entries.push(['captchaProvider', config.captchaProvider])
  if (config.turnstileSiteKey) entries.push(['turnstileSiteKey', config.turnstileSiteKey])
  if (config.hcaptchaSiteKey) entries.push(['hcaptchaSiteKey', config.hcaptchaSiteKey])
  if (config.formTitle) entries.push(['formTitle', config.formTitle])
  if (config.formSubtitle) entries.push(['formSubtitle', config.formSubtitle])
  if (config.messageLabel) entries.push(['messageLabel', config.messageLabel])
  if (config.messagePlaceholder) entries.push(['messagePlaceholder', config.messagePlaceholder])
  if (config.emailLabel) entries.push(['emailLabel', config.emailLabel])
  if (config.submitButtonText) entries.push(['submitButtonText', config.submitButtonText])
  if (config.cancelButtonText) entries.push(['cancelButtonText', config.cancelButtonText])
  if (config.successTitle) entries.push(['successTitle', config.successTitle])
  if (config.successDescription) entries.push(['successDescription', config.successDescription])
  if (config.openOnKey) entries.push(['openOnKey', config.openOnKey])
  if (typeof config.openAfterMs === 'number') entries.push(['openAfterMs', config.openAfterMs])

  return entries
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

function formatReactSnippet(config: WidgetConfig, appOrigin?: string): string {
  const props = getWrapperPropEntries(config, appOrigin)
  return [
    `import { FeedbacksWidget } from '@feedbacks/widget-react'`,
    '',
    'export default function App() {',
    '  return (',
    '    <>',
    '      <FeedbacksWidget',
    ...props.map(([key, value]) => `        ${key}=${formatReactValue(value)}`),
    '      />',
    '      {/* your app */}',
    '    </>',
    '  )',
    '}',
  ].join('\n')
}

function formatVueSnippet(config: WidgetConfig, appOrigin?: string): string {
  const props = getWrapperPropEntries(config, appOrigin)
  return [
    '<script setup>',
    `import { FeedbacksWidget } from '@feedbacks/widget-vue'`,
    '</script>',
    '',
    '<template>',
    '  <FeedbacksWidget',
    ...props.map(([key, value]) => formatVueProp(key, value)),
    '  />',
    '</template>',
  ].join('\n')
}

export function generateInstallSnippets(input: GenerateInstallSnippetsInput): InstallSnippet[] {
  const runtimeConfig = buildRuntimeWidgetConfig(input.projectKey, input.savedConfig, {
    appOrigin: input.appOrigin,
  })

  return [
    {
      label: 'Website',
      language: 'html',
      code: formatWebsiteSnippet(runtimeConfig, input.appOrigin),
    },
    {
      label: 'React',
      language: 'tsx',
      code: formatReactSnippet(runtimeConfig, input.appOrigin),
    },
    {
      label: 'Vue',
      language: 'vue',
      code: formatVueSnippet(runtimeConfig, input.appOrigin),
    },
  ]
}
