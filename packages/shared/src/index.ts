// Shared types between widget and dashboard

export type FeedbackType = 'bug' | 'idea' | 'praise' | 'question'
export type FeedbackStatus = 'new' | 'reviewed' | 'planned' | 'in_progress' | 'closed'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'
export type EmbedMode = 'modal' | 'inline' | 'trigger'
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface FeedbackSubmission {
  apiKey: string
  message: string
  email?: string
  url: string
  userAgent: string
  type?: FeedbackType
  rating?: number
  priority?: FeedbackPriority
  tags?: string[]
  screenshot?: string
  turnstileToken?: string
  hcaptchaToken?: string
}

export interface FeedbackResponse {
  success: boolean
  id?: string
  error?: string
}

export interface WidgetConfig {
  projectKey: string
  apiUrl?: string
  embedMode?: EmbedMode
  position?: WidgetPosition
  target?: string
  buttonText?: string
  primaryColor?: string
  backgroundColor?: string
  formTitle?: string
  formSubtitle?: string
  messageLabel?: string
  messagePlaceholder?: string
  emailLabel?: string
  submitButtonText?: string
  cancelButtonText?: string
  enableType?: boolean
  enableRating?: boolean
  enableScreenshot?: boolean
  enableAttachment?: boolean
  enablePriority?: boolean
  enableTags?: boolean
  requireEmail?: boolean
  requireCaptcha?: boolean
  captchaProvider?: 'turnstile' | 'hcaptcha'
  turnstileSiteKey?: string
  hcaptchaSiteKey?: string
  debug?: boolean
}
