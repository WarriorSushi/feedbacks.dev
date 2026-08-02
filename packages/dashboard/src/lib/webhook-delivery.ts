import { Feedback, Project, WebhookEndpoint, GitHubEndpoint, WebhookConfig } from '@/lib/types'
import { createAdminSupabase } from '@/lib/supabase-server'
import { notifyUserOfWebhookFailure } from '@/lib/notifications'
import { normalizeWebhookConfig, type WebhookKind } from '@/lib/webhook-config'
import { buildE2ETestWebhookUrl, getE2EBypassSecret, isE2ETestWebhookUrl } from '@/lib/e2e'
import { buildGenericWebhookSignatureHeaders } from '@/lib/webhook-signing'
import { postPublicWebhookJson, WEBHOOK_REQUEST_TIMEOUT_MS } from '@/lib/webhook-http'
import {
  integrationDestinationHint,
  redactWebhookDestination,
  resolveIntegrationEndpoint,
  toSafeEndpoint,
} from '@/lib/integration-secrets'
import {
  buildDigestPayload,
  buildPayload,
  isDigestPayload,
  type WebhookDeliveryPayload,
  type WebhookPayload,
} from './webhook-payloads'

function buildSlackBody(payload: WebhookDeliveryPayload) {
  if (isDigestPayload(payload)) {
    const sample = payload.feedbacks.slice(0, 5)
    return {
      text: `${payload.count} feedback items on ${payload.project.name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.count} feedback items* on *${payload.project.name}*`,
          },
        },
        ...sample.map((item) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${item.type ?? 'feedback'}*${item.priority ? ` [${item.priority}]` : ''}: ${item.message ?? ''}`,
          },
        })),
      ],
    }
  }

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

function buildDiscordBody(payload: WebhookDeliveryPayload) {
  if (isDigestPayload(payload)) {
    return {
      content: `${payload.count} feedback items on **${payload.project.name}**`,
      embeds: [
        {
          title: 'Feedback digest',
          description: payload.feedbacks
            .slice(0, 8)
            .map((item) => `• **${item.type ?? 'feedback'}**: ${item.message ?? ''}`)
            .join('\n'),
          color: 0x22c55e,
          fields: [
            { name: 'Items', value: String(payload.count), inline: true },
            { name: 'Window', value: `${payload.window.start} to ${payload.window.end}`, inline: false },
          ],
          timestamp: payload.timestamp,
        },
      ],
    }
  }

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

async function createGitHubIssue(endpoint: GitHubEndpoint, payload: WebhookDeliveryPayload) {
  if (isDigestPayload(payload)) {
    const [owner, repo] = endpoint.repo.split('/')
    const labels = endpoint.labels ? endpoint.labels.split(',').map(l => l.trim()) : []
    labels.push('feedback')

    const body = [
      `**Feedback digest from ${payload.project.name}**`,
      '',
      `Window: ${payload.window.start} to ${payload.window.end}`,
      '',
      ...payload.feedbacks.map((item, index) => (
        `${index + 1}. **${item.type ?? 'feedback'}**${item.priority ? ` [${item.priority}]` : ''}: ${item.message ?? ''}`
      )),
    ].join('\n')

    return fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${endpoint.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[feedback digest] ${payload.count} items from ${payload.project.name}`,
        body,
        labels,
      }),
    })
  }

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
  payload: WebhookDeliveryPayload,
  projectId: string,
  admin: Awaited<ReturnType<typeof createAdminSupabase>>,
  destinationHint = integrationDestinationHint(
    type,
    {
      url: endpoint.url,
      token: type === 'github' ? (endpoint as GitHubEndpoint).token : undefined,
      signingSecret: type === 'generic' ? endpoint.signingSecret : undefined,
    },
    type === 'github' ? endpoint as GitHubEndpoint : undefined,
  ),
) {
  const deliveryId = crypto.randomUUID()
  let status: 'success' | 'failed' = 'failed'
  let statusCode: number | null = null
  let responseBody: string | null = null
  const attempt = 1

  try {
    if (type === 'github') {
      const response = await createGitHubIssue(endpoint as GitHubEndpoint, payload)
      statusCode = response.status
      responseBody = (await response.text()).slice(0, 1000)
      status = response.ok ? 'success' : 'failed'
    } else {
      const messageBody = type === 'slack'
        ? buildSlackBody(payload)
        : type === 'discord'
          ? buildDiscordBody(payload)
          : payload
      const rawBody = JSON.stringify(messageBody)
      const headers = {
        ...(type === 'generic'
          ? buildGenericWebhookSignatureHeaders(rawBody, (endpoint as WebhookEndpoint).signingSecret)
          : {}),
        ...(isE2ETestWebhookUrl(endpoint.url) && getE2EBypassSecret()
          ? { 'x-feedbacks-e2e-bypass': getE2EBypassSecret() as string }
          : {}),
      }

      if (isE2ETestWebhookUrl(endpoint.url)) {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: rawBody,
          redirect: 'manual',
          signal: AbortSignal.timeout(WEBHOOK_REQUEST_TIMEOUT_MS),
        })
        statusCode = response.status
        responseBody = response.status >= 300 && response.status < 400
          ? 'Redirect responses are not followed for webhook delivery'
          : (await response.text()).slice(0, 1000)
        status = response.ok ? 'success' : 'failed'
      } else {
        const response = await postPublicWebhookJson({
          url: endpoint.url,
          body: rawBody,
          headers,
        })
        statusCode = response.status
        responseBody = response.body.slice(0, 1000)
        status = response.ok ? 'success' : 'failed'
      }
    }
  } catch (error) {
    responseBody = error instanceof Error ? error.message : 'Unknown error'
  }

  // Log the delivery using the database column names.
  await admin.from('webhook_deliveries').insert({
    id: deliveryId,
    project_id: projectId,
    event: payload.event,
    kind: type,
    endpoint_id: endpoint.id,
    url: destinationHint,
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
      .eq('endpoint_id', endpoint.id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (failures && failures.length >= 3 && failures.every(f => f.status === 'failed')) {
      const { data: project } = await admin
        .from('projects')
        .select('webhooks, owner_user_id, name')
        .eq('id', projectId)
        .single()
      if (project?.webhooks) {
        const webhooks = project.webhooks as WebhookConfig
        const group = webhooks[type as keyof WebhookConfig]
        if (group?.endpoints) {
          const ep = group.endpoints.find(e => e.id === endpoint.id)
          if (ep) {
            ep.enabled = false
            await admin.from('projects').update({ webhooks }).eq('id', projectId)
            if (project.owner_user_id) {
              void notifyUserOfWebhookFailure(project.owner_user_id, project.name, destinationHint)
            }
          }
        }
      }
    }
  }

  return { deliveryId, status }
}

interface QueuedWebhookPayload {
  endpoint: WebhookEndpoint | GitHubEndpoint
  payload: WebhookDeliveryPayload
}

function buildQueuedPayload(endpoint: WebhookEndpoint | GitHubEndpoint, payload: WebhookDeliveryPayload): QueuedWebhookPayload {
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
    payload: payload as WebhookDeliveryPayload,
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
  event: WebhookPayload['event'] = 'feedback.new',
  endpointLimit: number | null = null,
) {
  const payload = buildPayload(feedback, project, event)
  const admin = await createAdminSupabase()
  const normalizedWebhooks = normalizeWebhookConfig(webhooks)
  const rows: Array<Record<string, unknown>> = []
  const digestRows: Array<Record<string, unknown>> = []
  let enabledEndpointCount = 0

  for (const type of ['slack', 'discord', 'generic'] as const) {
    const group = normalizedWebhooks[type]
    if (!group?.endpoints) continue

    for (const endpoint of group.endpoints) {
      if (!endpoint.enabled) continue
      const withinPlan = endpointLimit === null || enabledEndpointCount < endpointLimit
      enabledEndpointCount += 1
      if (!withinPlan) continue
      if (!matchesWebhookRules(endpoint, feedback)) continue
      const row = {
        project_id: project.id,
        kind: type,
        endpoint_id: endpoint.id,
        endpoint_url: endpoint.destinationHint || redactWebhookDestination(endpoint.url),
        event: payload.event,
        payload: buildQueuedPayload(toSafeEndpoint(type, endpoint, endpoint.destinationHint), payload),
        status: 'pending',
        attempt: 0,
        max_attempts: event === 'feedback.test' ? 1 : 4,
        next_attempt_at: new Date().toISOString(),
      }
      if (endpoint.delivery === 'digest' && event === 'feedback.new') digestRows.push(row)
      else rows.push(row)
    }
  }

  if (normalizedWebhooks.github?.endpoints) {
    for (const endpoint of normalizedWebhooks.github.endpoints) {
      if (!endpoint.enabled) continue
      const withinPlan = endpointLimit === null || enabledEndpointCount < endpointLimit
      enabledEndpointCount += 1
      if (!withinPlan) continue
      if (!matchesWebhookRules(endpoint, feedback)) continue
      const row = {
        project_id: project.id,
        kind: 'github',
        endpoint_id: endpoint.id,
        endpoint_url: endpoint.destinationHint || endpoint.repo,
        event: payload.event,
        payload: buildQueuedPayload(toSafeEndpoint('github', endpoint, endpoint.destinationHint || endpoint.repo), payload),
        status: 'pending',
        attempt: 0,
        max_attempts: event === 'feedback.test' ? 1 : 4,
        next_attempt_at: new Date().toISOString(),
      }
      if (endpoint.delivery === 'digest' && event === 'feedback.new') digestRows.push(row)
      else rows.push(row)
    }
  }

  if (digestRows.length > 0) {
    const digestDate = new Date().toISOString().slice(0, 10)
    const { error } = await admin
      .from('webhook_digest_items')
      .insert(digestRows.map((row) => ({ ...row, digest_date: digestDate })))
    if (error) throw new Error(error.message)
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

type WebhookDigestItemRow = {
  id: string
  project_id: string
  kind: WebhookKind
  endpoint_id: string | null
  endpoint_url: string
  payload: unknown
  attempt: number
  max_attempts: number
  digest_date: string
  created_at: string
}

function digestGroupKey(row: Pick<WebhookDigestItemRow, 'project_id' | 'kind' | 'endpoint_id' | 'endpoint_url' | 'digest_date'>) {
  return [
    row.project_id,
    row.kind,
    row.endpoint_id || '',
    row.endpoint_url,
    row.digest_date,
  ].join('::')
}

async function requeueStaleWebhookDigestItems(
  admin: Awaited<ReturnType<typeof createAdminSupabase>>,
  staleBefore: string,
) {
  await admin
    .from('webhook_digest_items')
    .update({
      status: 'retrying',
      locked_at: null,
      last_error: 'Recovered stale processing lock',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lt('locked_at', staleBefore)
}

export async function processWebhookDigests({ limit = 100 }: { limit?: number } = {}) {
  const admin = await createAdminSupabase()
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  await requeueStaleWebhookDigestItems(admin, staleBefore)

  const { data: items, error } = await admin
    .from('webhook_digest_items')
    .select('id, project_id, kind, endpoint_id, endpoint_url, payload, attempt, max_attempts, digest_date, created_at')
    .in('status', ['pending', 'retrying'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('digest_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error || !items || items.length === 0) return []

  const grouped = new Map<string, WebhookDigestItemRow[]>()
  for (const item of items as WebhookDigestItemRow[]) {
    const key = digestGroupKey(item)
    const current = grouped.get(key) || []
    current.push(item)
    grouped.set(key, current)
  }

  const results: Array<{ digestKey: string; deliveryId: string; status: 'success' | 'failed'; itemCount: number }> = []

  for (const [key, group] of grouped) {
    const ids = group.map((item) => item.id)
    const nextAttempt = Math.max(...group.map((item) => item.attempt)) + 1
    const { data: claimed } = await admin
      .from('webhook_digest_items')
      .update({
        status: 'processing',
        attempt: nextAttempt,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .in('status', ['pending', 'retrying'])
      .select('id, project_id, kind, payload, attempt, max_attempts, created_at')

    if (!claimed || claimed.length === 0) continue

    try {
      const queuedItems = claimed.map((item) => parseQueuedPayload(item.payload))
      const first = queuedItems[0]
      const feedbacks = queuedItems
        .map((item) => isDigestPayload(item.payload) ? null : item.payload.feedback)
        .filter((item): item is Partial<Feedback> => Boolean(item))
      const timestamps = queuedItems
        .map((item) => item.payload.timestamp)
        .sort()
      const digestPayload = buildDigestPayload(
        feedbacks,
        first.payload.project,
        timestamps[0] || new Date().toISOString(),
        timestamps[timestamps.length - 1] || new Date().toISOString(),
      )
      const firstClaimed = claimed[0]
      const resolved = await resolveIntegrationEndpoint(
        admin,
        firstClaimed.project_id,
        firstClaimed.kind as WebhookKind,
        first.endpoint,
      )
      const delivery = await deliverSingle(
        firstClaimed.kind as WebhookKind,
        resolved.endpoint,
        digestPayload,
        firstClaimed.project_id,
        admin,
        resolved.destinationHint,
      )

      const exhausted = delivery.status === 'failed' && nextAttempt >= Math.max(...group.map((item) => item.max_attempts))
      await admin
        .from('webhook_digest_items')
        .update({
          status: delivery.status === 'success' ? 'succeeded' : exhausted ? 'failed' : 'retrying',
          next_attempt_at: delivery.status === 'success' ? new Date().toISOString() : exhausted ? new Date().toISOString() : nextAttemptAt(nextAttempt),
          locked_at: null,
          last_error: delivery.status === 'success' ? null : 'Digest delivery failed',
          last_delivery_id: delivery.deliveryId,
          updated_at: new Date().toISOString(),
        })
        .in('id', claimed.map((item) => item.id))

      results.push({ digestKey: key, deliveryId: delivery.deliveryId, status: delivery.status, itemCount: claimed.length })
    } catch (jobError) {
      const exhausted = nextAttempt >= Math.max(...group.map((item) => item.max_attempts))
      await admin
        .from('webhook_digest_items')
        .update({
          status: exhausted ? 'failed' : 'retrying',
          next_attempt_at: exhausted ? new Date().toISOString() : nextAttemptAt(nextAttempt),
          locked_at: null,
          last_error: jobError instanceof Error ? jobError.message : 'Digest processing failed',
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
    }
  }

  return results
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
      const resolved = await resolveIntegrationEndpoint(
        admin,
        claimed.project_id,
        claimed.kind as WebhookKind,
        queued.endpoint,
      )
      const delivery = await deliverSingle(
        claimed.kind as WebhookKind,
        resolved.endpoint,
        queued.payload,
        claimed.project_id,
        admin,
        resolved.destinationHint,
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
  project: Pick<Project, 'id' | 'name'>,
  destinationHint = integrationDestinationHint(
    type,
    { url: endpoint.url, token: type === 'github' ? (endpoint as GitHubEndpoint).token : undefined },
    type === 'github' ? endpoint as GitHubEndpoint : undefined,
  ),
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
      endpoint_url: destinationHint,
      event: 'feedback.test',
      payload: buildQueuedPayload(
        toSafeEndpoint(type, endpoint, destinationHint),
        buildPayload(testFeedback, project, 'feedback.test'),
      ),
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
  endpointId: string | null,
  url: string,
): WebhookEndpoint | GitHubEndpoint | null {
  const normalized = normalizeWebhookConfig(webhooks)
  if (type === 'github') {
    return normalized.github?.endpoints?.find((endpoint) =>
      endpointId ? endpoint.id === endpointId : endpoint.url === url || endpoint.destinationHint === url
    ) || null
  }

  return normalized[type]?.endpoints?.find((endpoint) =>
    endpointId ? endpoint.id === endpointId : endpoint.url === url || endpoint.destinationHint === url
  ) || null
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
    .select('id, kind, endpoint_id, url, payload')
    .eq('id', deliveryId)
    .eq('project_id', projectId)
    .single()

  if (!delivery) {
    throw new Error('Delivery not found')
  }

  const payload = typeof delivery.payload === 'string'
    ? JSON.parse(delivery.payload) as WebhookDeliveryPayload
    : delivery.payload as WebhookDeliveryPayload | null

  if (!payload || typeof payload !== 'object' || !payload.event) {
    throw new Error('Delivery payload is missing or invalid')
  }

  const type = delivery.kind as WebhookKind
  const endpoint = findReplayEndpoint(type, project.webhooks as WebhookConfig, delivery.endpoint_id, delivery.url)

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
      endpoint_url: endpoint.destinationHint || redactWebhookDestination(endpoint.url),
      event: payload.event,
      payload: buildQueuedPayload(toSafeEndpoint(type, endpoint, endpoint.destinationHint), payload),
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
