export interface Project {
  id: string
  owner_user_id: string
  name: string
  api_key: string
  domain: string | null
  webhooks: WebhookConfig
  settings: ProjectSettings
  created_at: string
  updated_at: string
}

export interface ProjectSettings {
  widget_config?: WidgetConfig
  notifications?: NotificationSettings
}

export interface WebhookConfig {
  slack?: WebhookEndpointGroup
  discord?: WebhookEndpointGroup
  generic?: WebhookEndpointGroup
  github?: GitHubEndpointGroup
}

export interface WebhookEndpointGroup {
  endpoints?: WebhookEndpoint[]
  url?: string
  enabled?: boolean
}

export interface GitHubEndpointGroup {
  endpoints?: GitHubEndpoint[]
}

export interface WebhookEndpoint {
  id: string
  url: string
  enabled: boolean
  delivery?: 'immediate' | 'digest'
  rules?: WebhookRules
  format?: 'compact' | 'full'
}

export interface GitHubEndpoint extends WebhookEndpoint {
  repo: string
  token: string
  labels?: string
}

export interface WebhookRules {
  ratingMax?: number
  types?: FeedbackType[]
  tagsInclude?: string[]
}

export interface NotificationSettings {
  email?: boolean
  emailAddress?: string
}

export type FeedbackType = 'bug' | 'idea' | 'praise' | 'question'
export type FeedbackStatus = 'new' | 'reviewed' | 'planned' | 'in_progress' | 'closed'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Feedback {
  id: string
  project_id: string
  message: string
  email: string | null
  url: string
  user_agent: string
  type: FeedbackType | null
  rating: number | null
  priority: FeedbackPriority | null
  status: FeedbackStatus
  tags: string[] | null
  screenshot_url: string | null
  attachments: FeedbackAttachment[] | null
  metadata: Record<string, unknown> | null
  is_archived: boolean
  is_public: boolean
  vote_count: number
  agent_name: string | null
  agent_session_id: string | null
  structured_data: StructuredFeedbackData | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Joined
  projects?: Pick<Project, 'id' | 'name'>
}

export interface FeedbackAttachment {
  url: string
  name: string
  type: string
  size: number
}

export interface FeedbackNote {
  id: string
  feedback_id: string
  user_id: string
  content: string
  created_at: string
}

export interface WidgetConfig {
  embedMode?: 'modal' | 'inline' | 'trigger'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  buttonText?: string
  primaryColor?: string
  enableType?: boolean
  enableRating?: boolean
  enableScreenshot?: boolean
  enableAttachment?: boolean
  enablePriority?: boolean
  enableTags?: boolean
  requireEmail?: boolean
  requireCaptcha?: boolean
  captchaProvider?: 'turnstile' | 'hcaptcha'
  formTitle?: string
  formSubtitle?: string
  messageLabel?: string
  messagePlaceholder?: string
  submitButtonText?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
  pageSize: number
}

export interface DashboardStats {
  totalFeedback: number
  newFeedback: number
  avgRating: number | null
  feedbackByType: { type: string; count: number }[]
  feedbackByStatus: { status: string; count: number }[]
  recentTrend: { date: string; count: number }[]
}

export interface StructuredFeedbackData {
  stack_trace?: string
  error_code?: string
  reproduction_steps?: string[]
  environment?: Record<string, string>
  severity?: string
  component?: string
  [key: string]: unknown
}

export interface PublicBoardSettings {
  id: string
  project_id: string
  enabled: boolean
  slug: string
  title: string | null
  description: string | null
  show_types: string[]
  allow_submissions: boolean
  require_email_to_vote: boolean
  custom_css: string | null
  branding: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  feedback_id: string
  voter_identifier: string
  vote_type: 'up' | 'down'
  created_at: string
}

export interface UserSettings {
  user_id: string
  preferences: {
    theme?: 'light' | 'dark' | 'system'
    defaultProject?: string
  }
  notification_settings: NotificationSettings
  created_at: string
  updated_at: string
}
