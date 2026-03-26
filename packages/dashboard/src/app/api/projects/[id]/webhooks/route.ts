import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import { resendWebhookDelivery, sendTestWebhook } from '@/lib/webhook-delivery'
import type { WebhookConfig, WebhookEndpoint, GitHubEndpoint } from '@/lib/types'
import { normalizeWebhookConfig } from '@/lib/webhook-config'

type RouteParams = { params: Promise<{ id: string }> }

async function getAuthedProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('id, name, webhooks, owner_user_id')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  return { project, admin }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('admin' in result)) return result.error
    const { project } = result as Exclude<typeof result, { error: NextResponse }>
    return NextResponse.json(normalizeWebhookConfig(project.webhooks))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('admin' in result)) return result.error
    const { admin } = result as Exclude<typeof result, { error: NextResponse }>

    const webhooks = normalizeWebhookConfig(await request.json())

    const { data, error } = await admin
      .from('projects')
      .update({ webhooks, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('webhooks')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data?.webhooks ?? {})
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('admin' in result)) return result.error
    const { project } = result as Exclude<typeof result, { error: NextResponse }>

    const body = await request.json()

    if (body?.action === 'resend') {
      if (!body.deliveryId) {
        return NextResponse.json({ error: 'deliveryId is required' }, { status: 400 })
      }

      const replay = await resendWebhookDelivery(project.id, body.deliveryId)
      return NextResponse.json(replay)
    }

    const { type, endpoint } = body as {
      type: 'slack' | 'discord' | 'generic' | 'github'
      endpoint: WebhookEndpoint | GitHubEndpoint
    }

    if (!type || !endpoint?.url) {
      return NextResponse.json({ error: 'type and endpoint.url are required' }, { status: 400 })
    }

    const normalized = normalizeWebhookConfig({
      [type]: type === 'github'
        ? { endpoints: [endpoint] }
        : { endpoints: [endpoint] },
    })
    const normalizedEndpoint = type === 'github'
      ? normalized.github?.endpoints?.[0]
      : normalized[type]?.endpoints?.[0]

    if (!normalizedEndpoint) {
      return NextResponse.json({ error: 'Endpoint is invalid' }, { status: 400 })
    }

    const delivery = await sendTestWebhook(type, normalizedEndpoint, { id: project.id, name: project.name })
    return NextResponse.json(delivery)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
