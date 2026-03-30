export * from './widget-install'
export * from './plans'

export type FeedbackType = 'bug' | 'idea' | 'praise' | 'question'
export type FeedbackStatus = 'new' | 'reviewed' | 'planned' | 'in_progress' | 'closed'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

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

export type FeedbackData = FeedbackSubmission

export interface FeedbackResponse {
  success: boolean
  id?: string
  error?: string
}
