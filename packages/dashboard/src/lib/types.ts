import type {
  BillingStatus,
  EntitlementSet,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  PlanTier,
  SavedWidgetConfig,
  UsageSnapshot,
} from '@feedbacks/shared'
import type { BoardAnnouncement, BoardBranding, BoardVisibility } from '@/lib/public-board'

export type {
  BillingStatus,
  EntitlementSet,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  PlanTier,
  QuotaErrorCode,
  SavedWidgetConfig,
  UsageSnapshot,
} from '@feedbacks/shared'

export interface Project {
  id: string
  owner_user_id: string
  name: string
  api_key: string | null
  api_key_last_four: string | null
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
  dailyDigest?: boolean
  webhookFailures?: boolean
  billingFailures?: boolean
}

export interface Feedback {
  id: string
  project_id: string
  message: string
  email: string | null
  url: string | null
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

export type WidgetConfig = SavedWidgetConfig

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
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface PublicBoardRecord extends PublicBoardSettings {
  profile: BoardBranding
  announcements: BoardAnnouncement[]
}

export interface BoardReport {
  id: string
  board_id: string
  project_id: string
  feedback_id: string | null
  user_id: string | null
  reporter_email: string | null
  target_type: 'board' | 'feedback'
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

export interface WebhookJob {
  id: string
  project_id: string
  kind: 'slack' | 'discord' | 'generic' | 'github' | 'email'
  endpoint_id: string | null
  endpoint_url: string
  event: string
  status: 'pending' | 'processing' | 'retrying' | 'succeeded' | 'failed'
  attempt: number
  max_attempts: number
  next_attempt_at: string
  last_error: string | null
  last_delivery_id: string | null
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

export interface BillingAccount {
  user_id: string
  plan_tier: PlanTier
  billing_status: BillingStatus
  dodo_customer_id: string | null
  dodo_subscription_id: string | null
  dodo_product_id: string | null
  billing_email: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  last_event_id: string | null
  last_event_type: string | null
  created_at: string
  updated_at: string
}

export interface BillingSummary {
  account: BillingAccount
  entitlements: EntitlementSet
  usage: UsageSnapshot
  billingEnabled: boolean
}
