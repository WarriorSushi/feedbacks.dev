import type {
  FeedbackType,
  GitHubEndpoint,
  WebhookConfig,
  WebhookEndpoint,
  WebhookEndpointGroup,
  WebhookRules,
} from '@/lib/types'
import { isE2ETestWebhookUrl } from '@/lib/e2e'

export type WebhookKind = 'slack' | 'discord' | 'generic' | 'github'
export type EndpointHealthStatus = 'healthy' | 'attention' | 'failing' | 'disabled' | 'idle'

export interface WebhookDeliveryLog {
  id: string
  event: string
  kind: WebhookKind
  url: string
  status: 'success' | 'failed'
  status_code: number | null
  response_body: string | null
  attempt: number
  payload: string | null
  created_at: string
}

export interface WebhookEndpointState {
  kind: WebhookKind
  endpoint: WebhookEndpoint | GitHubEndpoint
  lastDeliveryAt: string | null
  lastStatus: 'success' | 'failed' | null
  recentFailures: number
  health: EndpointHealthStatus
}

const WEBHOOK_TYPES: readonly WebhookKind[] = ['slack', 'discord', 'generic', 'github']
const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const WEBHOOK_FORMATS = new Set(['compact', 'full'])

function makeEndpointId(kind: WebhookKind): string {
  try {
    return `${kind}-${crypto.randomUUID()}`
  } catch {
    return `${kind}-${Math.random().toString(36).slice(2, 10)}`
  }
}

function sanitizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function sanitizeUrl(value: unknown): string | undefined {
  const trimmed = sanitizeString(value, 1000)
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol !== 'https:'
      && !isE2ETestWebhookUrl(parsed.toString(), { requireSecret: typeof window === 'undefined' })
    ) {
      return undefined
    }
    return parsed.toString()
  } catch {
    return undefined
  }
}

export function buildGitHubEndpointUrl(repo: string): string {
  return `https://api.github.com/repos/${repo}/issues`
}

function sanitizeRepo(value: unknown): string | undefined {
  const trimmed = sanitizeString(value, 200)
  if (!trimmed) return undefined
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed) ? trimmed : undefined
}

function sanitizeRules(value: unknown): WebhookRules | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const source = value as Record<string, unknown>
  const types = Array.isArray(source.types)
    ? source.types.filter((entry): entry is FeedbackType => FEEDBACK_TYPES.includes(entry as FeedbackType))
    : undefined
  const tagsInclude = Array.isArray(source.tagsInclude)
    ? source.tagsInclude
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 8)
    : undefined
  const ratingMaxRaw = typeof source.ratingMax === 'number' ? source.ratingMax : undefined
  const ratingMax = typeof ratingMaxRaw === 'number'
    ? Math.min(5, Math.max(1, Math.round(ratingMaxRaw)))
    : undefined

  const rules: WebhookRules = {}
  if (types && types.length > 0) rules.types = [...new Set(types)]
  if (tagsInclude && tagsInclude.length > 0) rules.tagsInclude = [...new Set(tagsInclude)]
  if (ratingMax !== undefined) rules.ratingMax = ratingMax

  return Object.keys(rules).length > 0 ? rules : undefined
}

function sanitizeBaseEndpoint(
  kind: WebhookKind,
  endpoint: unknown,
): WebhookEndpoint | undefined {
  if (!endpoint || typeof endpoint !== 'object' || Array.isArray(endpoint)) return undefined
  const source = endpoint as Record<string, unknown>
  const url = sanitizeUrl(source.url)
  if (!url) return undefined

  return {
    id: sanitizeString(source.id, 120) || makeEndpointId(kind),
    url,
    enabled: source.enabled !== false,
    delivery: source.delivery === 'digest' ? 'digest' : 'immediate',
    format: WEBHOOK_FORMATS.has(String(source.format)) ? (source.format as 'compact' | 'full') : 'full',
    rules: sanitizeRules(source.rules),
  }
}

function sanitizeGitHubEndpoint(endpoint: unknown): GitHubEndpoint | undefined {
  if (!endpoint || typeof endpoint !== 'object' || Array.isArray(endpoint)) return undefined
  const source = endpoint as Record<string, unknown>
  const repo = sanitizeRepo(source.repo)
  const token = sanitizeString(source.token, 300)
  if (!repo || !token) return undefined

  const base = sanitizeBaseEndpoint('github', {
    ...source,
    url: sanitizeUrl(source.url) || buildGitHubEndpointUrl(repo),
  })

  if (!base) return undefined

  return {
    ...base,
    repo,
    token,
    labels: sanitizeString(source.labels, 300),
  }
}

function sanitizeEndpointGroup(
  kind: Exclude<WebhookKind, 'github'>,
  group: unknown,
): WebhookEndpointGroup | undefined {
  if (!group || typeof group !== 'object' || Array.isArray(group)) return undefined
  const source = group as Record<string, unknown>

  const endpoints = Array.isArray(source.endpoints)
    ? source.endpoints
        .map((entry) => sanitizeBaseEndpoint(kind, entry))
        .filter((entry): entry is WebhookEndpoint => Boolean(entry))
    : []

  if (endpoints.length === 0) {
    const flatUrl = sanitizeUrl(source.url)
    if (flatUrl) {
      endpoints.push({
        id: makeEndpointId(kind),
        url: flatUrl,
        enabled: source.enabled !== false,
        delivery: 'immediate',
        format: 'full',
      })
    }
  }

  if (endpoints.length === 0) return undefined
  return { endpoints }
}

export function normalizeWebhookConfig(input: unknown): WebhookConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const source = input as Record<string, unknown>
  const config: WebhookConfig = {}

  const slack = sanitizeEndpointGroup('slack', source.slack)
  if (slack) config.slack = slack

  const discord = sanitizeEndpointGroup('discord', source.discord)
  if (discord) config.discord = discord

  const generic = sanitizeEndpointGroup('generic', source.generic)
  if (generic) config.generic = generic

  if (source.github && typeof source.github === 'object' && !Array.isArray(source.github)) {
    const githubSource = source.github as Record<string, unknown>
    const endpoints = Array.isArray(githubSource.endpoints)
      ? githubSource.endpoints
          .map((entry) => sanitizeGitHubEndpoint(entry))
          .filter((entry): entry is GitHubEndpoint => Boolean(entry))
      : []

    if (endpoints.length > 0) {
      config.github = { endpoints }
    }
  }

  return config
}

export function createWebhookEndpoint(kind: Exclude<WebhookKind, 'github'>): WebhookEndpoint {
  return {
    id: makeEndpointId(kind),
    url: '',
    enabled: true,
    delivery: 'immediate',
    format: 'full',
  }
}

export function createGitHubEndpoint(): GitHubEndpoint {
  return {
    id: makeEndpointId('github'),
    url: '',
    enabled: true,
    delivery: 'immediate',
    format: 'full',
    repo: '',
    token: '',
    labels: '',
  }
}

export function listWebhookEndpointStates(
  config: WebhookConfig,
  deliveries: WebhookDeliveryLog[] = [],
): WebhookEndpointState[] {
  const states: WebhookEndpointState[] = []

  for (const kind of WEBHOOK_TYPES) {
    const endpoints = kind === 'github'
      ? config.github?.endpoints || []
      : config[kind]?.endpoints || []

    endpoints.forEach((endpoint) => {
      const matchingDeliveries = deliveries
        .filter((delivery) => delivery.kind === kind && delivery.url === endpoint.url)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const recentFailures = matchingDeliveries
        .slice(0, 3)
        .filter((delivery) => delivery.status === 'failed')
        .length
      const lastDelivery = matchingDeliveries[0]
      const health: EndpointHealthStatus = endpoint.enabled === false
        ? 'disabled'
        : !lastDelivery
          ? 'idle'
          : lastDelivery.status === 'success'
            ? 'healthy'
            : recentFailures >= 2
              ? 'failing'
              : 'attention'

      states.push({
        kind,
        endpoint,
        lastDeliveryAt: lastDelivery?.created_at || null,
        lastStatus: lastDelivery?.status || null,
        recentFailures,
        health,
      })
    })
  }

  return states
}
