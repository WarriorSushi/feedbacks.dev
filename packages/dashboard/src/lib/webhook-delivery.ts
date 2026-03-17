import { Feedback, Project, WebhookEndpoint, GitHubEndpoint, WebhookConfig } from '@/lib/types'
import { createAdminSupabase } from '@/lib/supabase-server'

interface WebhookPayload {
  event: 'feedback.new' | 'feedback.test'
  feedback: Partial<Feedback>
  project: Pick<Project, 'id' | 'name'>
  timestamp: string
}

function buildPayload(feedback: Partial<Feedback>, project: Pick<Project, 'id' | 'name'>, event: WebhookPayload['event'] = 'feedback.new'): WebhookPayload {
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

function matchesRules(endpoint: WebhookEndpoint, feedback: Partial<Feedback>): boolean {
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
  type: 'slack' | 'discord' | 'generic' | 'github',
  endpoint: WebhookEndpoint | GitHubEndpoint,
  payload: WebhookPayload,
  projectId: string
) {
  const admin = await createAdminSupabase()
  const deliveryId = crypto.randomUUID()
  let status: 'success' | 'failed' = 'failed'
  let responseCode: number | null = null
  let responseBody: string | null = null
  let attempts = 0
  const maxRetries = 3

  for (let i = 0; i < maxRetries; i++) {
    attempts++
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      responseCode = res.status
      responseBody = (await res.text()).slice(0, 1000)

      if (res.ok) {
        status = 'success'
        // Reset consecutive failures
        await admin.rpc('reset_webhook_failures', { p_project_id: projectId, p_type: type, p_endpoint_id: endpoint.id }).catch(() => {})
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

  // Log delivery
  await admin.from('webhook_deliveries').insert({
    id: deliveryId,
    project_id: projectId,
    endpoint_type: type,
    endpoint_url: endpoint.url,
    status,
    response_code: responseCode,
    response_body: responseBody,
    attempts,
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
  }).catch(() => {})

  // Auto-disable after 3 consecutive failures
  if (status === 'failed') {
    const { data: failures } = await admin
      .from('webhook_deliveries')
      .select('status')
      .eq('project_id', projectId)
      .eq('endpoint_type', type)
      .eq('endpoint_url', endpoint.url)
      .order('created_at', { ascending: false })
      .limit(3)

    if (failures && failures.length >= 3 && failures.every(f => f.status === 'failed')) {
      // Disable this endpoint in the project webhooks config
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

export async function deliverWebhooks(
  webhooks: WebhookConfig,
  feedback: Partial<Feedback>,
  project: Pick<Project, 'id' | 'name'>,
  event: WebhookPayload['event'] = 'feedback.new'
) {
  const payload = buildPayload(feedback, project, event)
  const promises: Promise<unknown>[] = []

  for (const type of ['slack', 'discord', 'generic'] as const) {
    const group = webhooks[type]
    if (!group?.endpoints) continue
    for (const ep of group.endpoints) {
      if (!ep.enabled) continue
      if (!matchesRules(ep, feedback)) continue
      promises.push(deliverSingle(type, ep, payload, project.id))
    }
  }

  if (webhooks.github?.endpoints) {
    for (const ep of webhooks.github.endpoints) {
      if (!ep.enabled) continue
      if (!matchesRules(ep, feedback)) continue
      promises.push(deliverSingle('github', ep, payload, project.id))
    }
  }

  // Fire and forget — don't block
  Promise.allSettled(promises).catch(() => {})
}

export async function sendTestWebhook(
  type: 'slack' | 'discord' | 'generic' | 'github',
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
  const payload = buildPayload(testFeedback, project, 'feedback.test')
  return deliverSingle(type, endpoint, payload, project.id)
}
