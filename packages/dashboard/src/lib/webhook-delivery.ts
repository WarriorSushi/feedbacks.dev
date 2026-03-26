import { Feedback, Project, WebhookEndpoint, GitHubEndpoint, WebhookConfig } from '@/lib/types'
import { createAdminSupabase } from '@/lib/supabase-server'
import { normalizeWebhookConfig, type WebhookKind } from '@/lib/webhook-config'
import { buildE2ETestWebhookUrl, getE2EBypassSecret, isE2ETestWebhookUrl } from '@/lib/e2e'

export interface WebhookPayload {
  event: 'feedback.new' | 'feedback.test'
  feedback: Partial<Feedback>
  project: Pick<Project, 'id' | 'name'>
  timestamp: string
}

/** Blocklist of private/reserved IP ranges for SSRF prevention */
function isPrivateUrl(urlStr: string): boolean {
  if (isE2ETestWebhookUrl(urlStr)) {
    return false
  }

  try {
    const parsed = new URL(urlStr)
    // Only allow https
    if (parsed.protocol !== 'https:') return true

    const hostname = parsed.hostname
    // Block IPv6 loopback & private
    if (hostname === '::1' || hostname.startsWith('fc00:') || hostname.startsWith('fe80:')) return true
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    // Block private IPv4 ranges
    const parts = hostname.split('.').map(Number)
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      if (parts[0] === 10) return true
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
      if (parts[0] === 192 && parts[1] === 168) return true
      if (parts[0] === 169 && parts[1] === 254) return true
      if (parts[0] === 127) return true
    }
    return false
  } catch {
    return true
  }
}

export function buildPayload(feedback: Partial<Feedback>, project: Pick<Project, 'id' | 'name'>, event: WebhookPayload['event'] = 'feedback.new'): WebhookPayload {
  return {
    event,
    feedback,
    project,
    timestamp: new Date().toISOString(),
  }
}

function buildSlackBody(payload: WebhookPayload) {
  const f = payload.feedback
  return {
    text: `New ${f.type ?? 'feedback'} on ${payload.project.name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New ${f.type ?? 'feedback'}* on *${payload.project.name}*\n${f.message ?? ''}`,
        },
      },
      ...(f.email ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: `From: ${f.email}` }] }] : []),
      ...(f.rating ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: `Rating: ${'⭐'.repeat(f.rating)}` }] }] : []),
    ],
  }
}

function buildDiscordBody(payload: WebhookPayload) {
  const f = payload.feedback
  return {
    content: `New ${f.type ?? 'feedback'} on **${payload.project.name}**`,
    embeds: [
      {
        title: `${f.type ?? 'Feedback'}${f.priority ? ` [${f.priority}]` : ''}`,
        description: f.message ?? '',
        color: f.type === 'bug' ? 0xff0000 : f.type === 'idea' ? 0x00bfff : 0x00cc00,
        fields: [
          ...(f.email ? [{ name: 'Email', value: f.email, inline: true }] : []),
          ...(f.rating ? [{ name: 'Rating', value: '⭐'.repeat(f.rating), inline: true }] : []),
          ...(f.url ? [{ name: 'URL', value: f.url, inline: false }] : []),
        ],
        timestamp: payload.timestamp,
      },
    ],
  }
}

async function createGitHubIssue(endpoint: GitHubEndpoint, payload: WebhookPayload) {
  const f = payload.feedback
  const [owner, repo] = endpoint.repo.split('/')
  const labels = endpoint.labels ? endpoint.labels.split(',').map(l => l.trim()) : []
  if (f.type) labels.push(f.type)

  const e2eSecret = getE2EBypassSecret()
  const e2eTarget = buildE2ETestWebhookUrl('github')
  if (e2eSecret && e2eTarget && endpoint.token === e2eSecret) {
    return fetch(`${e2eTarget}?repo=${encodeURIComponent(endpoint.repo)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-feedbacks-e2e-bypass': e2eSecret,
      },
      body: JSON.stringify({
        title: `[${f.type ?? 'feedback'}] ${(f.message ?? '').slice(0, 80)}`,
        body: `**Feedback from ${payload.project.name}**\n\n${f.message}\n\n${f.email ? `- Email: ${f.email}` : ''}\n${f.url ? `- URL: ${f.url}` : ''}\n${f.rating ? `- Rating: ${f.rating}/5` : ''}`,
        labels,
      }),
    })
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${endpoint.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[${f.type ?? 'feedback'}] ${(f.message ?? '').slice(0, 80)}`,
      body: `**Feedback from ${payload.project.name}**\n\n${f.message}\n\n${f.email ? `- Email: ${f.email}` : ''}\n${f.url ? `- URL: ${f.url}` : ''}\n${f.rating ? `- Rating: ${f.rating}/5` : ''}`,
      labels,
    }),
  })
  return res
}

export function matchesWebhookRules(endpoint: WebhookEndpoint, feedback: Partial<Feedback>): boolean {
  const rules = endpoint.rules
  if (!rules) return true
  if (rules.types && rules.types.length > 0 && feedback.type && !rules.types.includes(feedback.type)) return false
  if (rules.ratingMax != null && feedback.rating != null && feedback.rating > rules.ratingMax) return false
  if (rules.tagsInclude && rules.tagsInclude.length > 0 && feedback.tags) {
    const has = rules.tagsInclude.some(t => feedback.tags!.includes(t))
    if (!has) return false
  }
  return true
}

async function deliverSingle(
  type: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
  payload: WebhookPayload,
  projectId: string,
  admin: Awaited<ReturnType<typeof createAdminSupabase>>
) {
  const deliveryId = crypto.randomUUID()
  let status: 'success' | 'failed' = 'failed'
  let statusCode: number | null = null
  let responseBody: string | null = null
  let attempt = 0
  const maxRetries = 3

  // SSRF check for non-GitHub endpoints
  if (type !== 'github' && isPrivateUrl(endpoint.url)) {
    responseBody = 'URL blocked: private/reserved IP or non-HTTPS'
    await admin.from('webhook_deliveries').insert({
      id: deliveryId,
      project_id: projectId,
      event: payload.event,
      kind: type,
      url: endpoint.url,
      status: 'failed',
      status_code: null,
      response_body: responseBody,
      attempt: 1,
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
    })
    return { deliveryId, status: 'failed' as const }
  }

  for (let i = 0; i < maxRetries; i++) {
    attempt++
    try {
      let res: Response

      if (type === 'github') {
        res = await createGitHubIssue(endpoint as GitHubEndpoint, payload)
      } else {
        const body = type === 'slack'
          ? buildSlackBody(payload)
          : type === 'discord'
            ? buildDiscordBody(payload)
            : payload

        res = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isE2ETestWebhookUrl(endpoint.url) && getE2EBypassSecret()
              ? { 'x-feedbacks-e2e-bypass': getE2EBypassSecret() as string }
              : {}),
          },
          body: JSON.stringify(body),
        })
      }

      statusCode = res.status
      responseBody = (await res.text()).slice(0, 1000)

      if (res.ok) {
        status = 'success'
        try { await admin.rpc('reset_webhook_failures', { p_project_id: projectId, p_type: type, p_endpoint_id: endpoint.id }) } catch { /* rpc may not exist */ }
        break
      }
    } catch (err) {
      responseBody = err instanceof Error ? err.message : 'Unknown error'
    }

    // Exponential backoff
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }

  // Log delivery — use correct DB column names
  await admin.from('webhook_deliveries').insert({
    id: deliveryId,
    project_id: projectId,
    event: payload.event,
    kind: type,
    url: endpoint.url,
    status,
    status_code: statusCode,
    response_body: responseBody,
    attempt,
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
  })

  // Auto-disable after 3 consecutive failures
  if (status === 'failed') {
    const { data: failures } = await admin
      .from('webhook_deliveries')
      .select('status')
      .eq('project_id', projectId)
      .eq('kind', type)
      .eq('url', endpoint.url)
      .order('created_at', { ascending: false })
      .limit(3)

    if (failures && failures.length >= 3 && failures.every(f => f.status === 'failed')) {
      const { data: project } = await admin.from('projects').select('webhooks').eq('id', projectId).single()
      if (project?.webhooks) {
        const webhooks = project.webhooks as WebhookConfig
        const group = webhooks[type as keyof WebhookConfig]
        if (group?.endpoints) {
          const ep = group.endpoints.find(e => e.id === endpoint.id)
          if (ep) {
            ep.enabled = false
            await admin.from('projects').update({ webhooks }).eq('id', projectId)
          }
        }
      }
    }
  }

  return { deliveryId, status }
}

interface QueuedWebhookPayload {
  endpoint: WebhookEndpoint | GitHubEndpoint
  payload: WebhookPayload
}

function buildQueuedPayload(endpoint: WebhookEndpoint | GitHubEndpoint, payload: WebhookPayload): QueuedWebhookPayload {
  return { endpoint, payload }
}

function parseQueuedPayload(value: unknown): QueuedWebhookPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Queued payload is missing')
  }

  const record = value as Record<string, unknown>
  const endpoint = record.endpoint
  const payload = record.payload
  if (!endpoint || typeof endpoint !== 'object' || !payload || typeof payload !== 'object') {
    throw new Error('Queued payload is invalid')
  }

  return {
    endpoint: endpoint as WebhookEndpoint | GitHubEndpoint,
    payload: payload as WebhookPayload,
  }
}

function nextAttemptAt(attempt: number): string {
  const delayMs = Math.min(10 * 60 * 1000, 1000 * Math.pow(2, Math.max(0, attempt - 1)))
  return new Date(Date.now() + delayMs).toISOString()
}

async function requeueStaleWebhookJobs(
  admin: Awaited<ReturnType<typeof createAdminSupabase>>,
  staleBefore: string,
) {
  await admin
    .from('webhook_jobs')
    .update({
      status: 'retrying',
      locked_at: null,
      last_error: 'Recovered stale processing lock',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lt('locked_at', staleBefore)
}

export async function enqueueWebhookJobs(
  webhooks: WebhookConfig,
  feedback: Partial<Feedback>,
  project: Pick<Project, 'id' | 'name'>,
  event: WebhookPayload['event'] = 'feedback.new'
) {
  const payload = buildPayload(feedback, project, event)
  const admin = await createAdminSupabase()
  const normalizedWebhooks = normalizeWebhookConfig(webhooks)
  const rows: Array<Record<string, unknown>> = []

  for (const type of ['slack', 'discord', 'generic'] as const) {
    const group = normalizedWebhooks[type]
    if (!group?.endpoints) continue

    for (const endpoint of group.endpoints) {
      if (!endpoint.enabled) continue
      if (!matchesWebhookRules(endpoint, feedback)) continue
      rows.push({
        project_id: project.id,
        kind: type,
        endpoint_id: endpoint.id,
        endpoint_url: endpoint.url,
        event: payload.event,
        payload: buildQueuedPayload(endpoint, payload),
        status: 'pending',
        attempt: 0,
        max_attempts: event === 'feedback.test' ? 1 : 4,
        next_attempt_at: new Date().toISOString(),
      })
    }
  }

  if (normalizedWebhooks.github?.endpoints) {
    for (const endpoint of normalizedWebhooks.github.endpoints) {
      if (!endpoint.enabled) continue
      if (!matchesWebhookRules(endpoint, feedback)) continue
      rows.push({
        project_id: project.id,
        kind: 'github',
        endpoint_id: endpoint.id,
        endpoint_url: endpoint.url,
        event: payload.event,
        payload: buildQueuedPayload(endpoint, payload),
        status: 'pending',
        attempt: 0,
        max_attempts: event === 'feedback.test' ? 1 : 4,
        next_attempt_at: new Date().toISOString(),
      })
    }
  }

  if (rows.length === 0) return []

  const { data, error } = await admin
    .from('webhook_jobs')
    .insert(rows)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((row) => row.id as string)
}

export async function processWebhookJobs({
  jobIds,
  projectId,
  limit = 20,
}: {
  jobIds?: string[]
  projectId?: string
  limit?: number
} = {}) {
  const admin = await createAdminSupabase()
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  await requeueStaleWebhookJobs(admin, staleBefore)
  let query = admin
    .from('webhook_jobs')
    .select('id, project_id, kind, endpoint_id, endpoint_url, payload, status, attempt, max_attempts')
    .in('status', ['pending', 'retrying'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit)

  if (projectId) query = query.eq('project_id', projectId)
  if (jobIds && jobIds.length > 0) query = query.in('id', jobIds)

  const { data: jobs, error } = await query
  if (error || !jobs || jobs.length === 0) {
    return []
  }

  const results: Array<{ jobId: string; deliveryId: string; status: 'success' | 'failed' }> = []

  for (const job of jobs) {
    const attempt = (job.attempt || 0) + 1
    const { data: claimed } = await admin
      .from('webhook_jobs')
      .update({
        status: 'processing',
        attempt,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .in('status', ['pending', 'retrying'])
      .select('id, project_id, kind, payload, attempt, max_attempts')
      .maybeSingle()

    if (!claimed) continue

    try {
      const queued = parseQueuedPayload(claimed.payload)
      const delivery = await deliverSingle(
        claimed.kind as WebhookKind,
        queued.endpoint,
        queued.payload,
        claimed.project_id,
        admin,
      )

      const exhausted = delivery.status === 'failed' && claimed.attempt >= claimed.max_attempts
      await admin
        .from('webhook_jobs')
        .update({
          status: delivery.status === 'success' ? 'succeeded' : exhausted ? 'failed' : 'retrying',
          next_attempt_at: delivery.status === 'success' ? new Date().toISOString() : exhausted ? new Date().toISOString() : nextAttemptAt(claimed.attempt),
          locked_at: null,
          last_error: delivery.status === 'success' ? null : 'Delivery failed',
          last_delivery_id: delivery.deliveryId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimed.id)

      results.push({ jobId: claimed.id, deliveryId: delivery.deliveryId, status: delivery.status })
    } catch (jobError) {
      const exhausted = claimed.attempt >= claimed.max_attempts
      await admin
        .from('webhook_jobs')
        .update({
          status: exhausted ? 'failed' : 'retrying',
          next_attempt_at: exhausted ? new Date().toISOString() : nextAttemptAt(claimed.attempt),
          locked_at: null,
          last_error: jobError instanceof Error ? jobError.message : 'Job processing failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimed.id)
    }
  }

  return results
}

// NOTE: In Vercel production, wrap calls to deliverWebhooks with waitUntil()
// for reliable background execution that survives after the response is sent.
// Example: waitUntil(deliverWebhooks(...))

export async function deliverWebhooks(
  webhooks: WebhookConfig,
  feedback: Partial<Feedback>,
  project: Pick<Project, 'id' | 'name'>,
  event: WebhookPayload['event'] = 'feedback.new'
) {
  const jobIds = await enqueueWebhookJobs(webhooks, feedback, project, event)
  if (jobIds.length === 0) return []
  return processWebhookJobs({ jobIds, limit: jobIds.length })
}

export async function sendTestWebhook(
  type: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
  project: Pick<Project, 'id' | 'name'>
) {
  const testFeedback: Partial<Feedback> = {
    id: 'test-' + crypto.randomUUID(),
    message: 'This is a test feedback from feedbacks.dev',
    type: 'idea',
    rating: 5,
    email: 'test@example.com',
    url: 'https://example.com',
    status: 'new',
    created_at: new Date().toISOString(),
  }
  const admin = await createAdminSupabase()
  const { data: jobs, error } = await admin
    .from('webhook_jobs')
    .insert({
      project_id: project.id,
      kind: type,
      endpoint_id: endpoint.id,
      endpoint_url: endpoint.url,
      event: 'feedback.test',
      payload: buildQueuedPayload(endpoint, buildPayload(testFeedback, project, 'feedback.test')),
      status: 'pending',
      attempt: 0,
      max_attempts: 1,
      next_attempt_at: new Date().toISOString(),
    })
    .select('id')

  if (error || !jobs || jobs.length === 0) {
    throw new Error(error?.message || 'Failed to queue test webhook')
  }

  const processed = await processWebhookJobs({ jobIds: jobs.map((job) => job.id as string), limit: jobs.length })
  const result = processed[0]
  if (!result) {
    throw new Error('Test webhook did not process')
  }
  return { deliveryId: result.deliveryId, status: result.status }
}

function findReplayEndpoint(
  type: WebhookKind,
  webhooks: WebhookConfig,
  url: string,
): WebhookEndpoint | GitHubEndpoint | null {
  const normalized = normalizeWebhookConfig(webhooks)
  if (type === 'github') {
    return normalized.github?.endpoints?.find((endpoint) => endpoint.url === url) || null
  }

  return normalized[type]?.endpoints?.find((endpoint) => endpoint.url === url) || null
}

export async function resendWebhookDelivery(
  projectId: string,
  deliveryId: string,
): Promise<{ deliveryId: string; status: 'success' | 'failed' }> {
  const admin = await createAdminSupabase()
  const { data: project } = await admin
    .from('projects')
    .select('id, name, webhooks')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error('Project not found')
  }

  const { data: delivery } = await admin
    .from('webhook_deliveries')
    .select('id, kind, url, payload')
    .eq('id', deliveryId)
    .eq('project_id', projectId)
    .single()

  if (!delivery) {
    throw new Error('Delivery not found')
  }

  const payload = typeof delivery.payload === 'string'
    ? JSON.parse(delivery.payload) as WebhookPayload
    : delivery.payload as WebhookPayload | null

  if (!payload || typeof payload !== 'object' || !payload.event) {
    throw new Error('Delivery payload is missing or invalid')
  }

  const type = delivery.kind as WebhookKind
  const endpoint = findReplayEndpoint(type, project.webhooks as WebhookConfig, delivery.url)

  if (!endpoint) {
    throw new Error(
      type === 'github'
        ? 'GitHub endpoint no longer exists on this project, so this delivery cannot be replayed'
        : 'Webhook endpoint no longer exists on this project',
    )
  }

  const { data: jobs, error } = await admin
    .from('webhook_jobs')
    .insert({
      project_id: project.id,
      kind: type,
      endpoint_id: endpoint.id,
      endpoint_url: endpoint.url,
      event: payload.event,
      payload: buildQueuedPayload(endpoint, payload),
      status: 'pending',
      attempt: 0,
      max_attempts: 1,
      next_attempt_at: new Date().toISOString(),
    })
    .select('id')

  if (error || !jobs || jobs.length === 0) {
    throw new Error(error?.message || 'Failed to queue replay')
  }

  const processed = await processWebhookJobs({ jobIds: jobs.map((job) => job.id as string), limit: jobs.length })
  const result = processed[0]
  if (!result) {
    throw new Error('Replay did not process')
  }

  return { deliveryId: result.deliveryId, status: result.status }
}
