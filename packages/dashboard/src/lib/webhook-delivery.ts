import { Feedback, Project, WebhookEndpoint, GitHubEndpoint, WebhookConfig } from '@/lib/types'
import { createAdminSupabase } from '@/lib/supabase-server'

interface WebhookPayload {
  event: 'feedback.new' | 'feedback.test'
  feedback: Partial<Feedback>
  project: Pick<Project, 'id' | 'name'>
  timestamp: string
}

/** Blocklist of private/reserved IP ranges for SSRF prevention */
function isPrivateUrl(urlStr: string): boolean {
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
          headers: { 'Content-Type': 'application/json' },
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

// NOTE: In Vercel production, wrap calls to deliverWebhooks with waitUntil()
// for reliable background execution that survives after the response is sent.
// Example: waitUntil(deliverWebhooks(...))

export async function deliverWebhooks(
  webhooks: WebhookConfig,
  feedback: Partial<Feedback>,
  project: Pick<Project, 'id' | 'name'>,
  event: WebhookPayload['event'] = 'feedback.new'
) {
  const payload = buildPayload(feedback, project, event)
  const admin = await createAdminSupabase() // Create once, pass to all
  const promises: Promise<unknown>[] = []

  for (const type of ['slack', 'discord', 'generic'] as const) {
    const group = webhooks[type]
    if (!group?.endpoints) continue
    for (const ep of group.endpoints) {
      if (!ep.enabled) continue
      if (!matchesRules(ep, feedback)) continue
      promises.push(deliverSingle(type, ep, payload, project.id, admin))
    }
  }

  if (webhooks.github?.endpoints) {
    for (const ep of webhooks.github.endpoints) {
      if (!ep.enabled) continue
      if (!matchesRules(ep, feedback)) continue
      promises.push(deliverSingle('github', ep, payload, project.id, admin))
    }
  }

  await Promise.allSettled(promises)
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
  const admin = await createAdminSupabase()
  return deliverSingle(type, endpoint, payload, project.id, admin)
}
