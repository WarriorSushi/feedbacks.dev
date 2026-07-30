import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import { assertFeatureAccess } from '@/lib/billing'
import { hasE2EBypass } from '@/lib/e2e'
import { resendWebhookDelivery, sendTestWebhook } from '@/lib/webhook-delivery'
import { countActiveWebhookEndpoints, normalizeWebhookConfig } from '@/lib/webhook-config'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import {
  persistWebhookConfig,
  resolveIntegrationEndpoint,
  toSafeWebhookConfig,
} from '@/lib/integration-secrets'
import { readJsonBody } from '@/lib/api-request'

type RouteParams = { params: Promise<{ id: string }> }

async function getAuthedProject(projectId: string, request: NextRequest) {
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
  if (!hasE2EBypass(request)) {
    const feature = await assertFeatureAccess(user.id, 'webhooks', user.email)
    if (!feature.allowed) {
      return {
        error: NextResponse.json({ error: feature.message, code: feature.code }, { status: 403 }),
      }
    }
    return { project, admin, summary: feature.summary }
  }
  return { project, admin, summary: null }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id, _request)
    if ('error' in result && !('admin' in result)) return result.error
    const { project, admin } = result as Exclude<typeof result, { error: NextResponse }>
    const normalized = normalizeWebhookConfig(project.webhooks)
    const containsLegacySecrets = [
      ...(normalized.slack?.endpoints || []),
      ...(normalized.discord?.endpoints || []),
      ...(normalized.generic?.endpoints || []),
      ...(normalized.github?.endpoints || []),
    ].some((endpoint) => !endpoint.secretStored)
    if (containsLegacySecrets) {
      const migrated = await persistWebhookConfig(admin, project.id, normalized)
      const { error } = await admin
        .from('projects')
        .update({ webhooks: migrated, updated_at: new Date().toISOString() })
        .eq('id', project.id)
      if (error) throw new Error(error.message)
      return NextResponse.json(migrated)
    }
    return NextResponse.json(toSafeWebhookConfig(normalized))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id, request)
    if ('error' in result && !('admin' in result)) return result.error
    const { admin, summary, project } = result as Exclude<typeof result, { error: NextResponse }>

    const requestBodyResult = await readJsonBody(request)
    if (!requestBodyResult.ok) return requestBodyResult.response
    const requestBody = requestBodyResult.data
    const webhooks = normalizeWebhookConfig(requestBody)
    const endpointLimit = summary?.entitlements.webhookEndpointLimit ?? null
    const activeEndpointCount = countActiveWebhookEndpoints(webhooks)

    if (endpointLimit !== null && activeEndpointCount > endpointLimit) {
      return NextResponse.json(
        {
          error: `Free plan includes ${endpointLimit} active integration endpoint. Disable another endpoint or upgrade to Pro.`,
          code: 'webhook_endpoint_limit_reached',
          limit: endpointLimit,
          activeEndpointCount,
        },
        { status: 403 },
      )
    }

    const safeWebhooks = await persistWebhookConfig(admin, id, webhooks)
    const { data, error } = await admin
      .from('projects')
      .update({ webhooks: safeWebhooks, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('webhooks')
      .single()

    if (error) return NextResponse.json({ code: 'integration_save_failed', error: 'Integration settings could not be saved.' }, { status: 500 })
    if (activeEndpointCount > 0) {
      await recordActivationMilestone({
        projectId: id,
        userId: project.owner_user_id,
        eventName: 'integration_connected',
        admin,
      })
    }
    return NextResponse.json(data?.webhooks ?? {})
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id, request)
    if ('error' in result && !('admin' in result)) return result.error
    const { project, admin } = result as Exclude<typeof result, { error: NextResponse }>

    const bodyResult = await readJsonBody<{
      action?: string
      deliveryId?: string
      type?: 'slack' | 'discord' | 'generic' | 'github'
      endpointId?: string
    }>(request)
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data

    if (body?.action === 'resend') {
      if (!body.deliveryId) {
        return NextResponse.json({ error: 'deliveryId is required' }, { status: 400 })
      }

      const replay = await resendWebhookDelivery(project.id, body.deliveryId)
      return NextResponse.json(replay)
    }

    const { type, endpointId } = body as {
      type: 'slack' | 'discord' | 'generic' | 'github'
      endpointId: string
    }

    if (!type || !endpointId) {
      return NextResponse.json({ error: 'type and endpointId are required' }, { status: 400 })
    }

    const normalized = normalizeWebhookConfig(project.webhooks)
    const normalizedEndpoint = type === 'github'
      ? normalized.github?.endpoints?.find((endpoint) => endpoint.id === endpointId)
      : normalized[type]?.endpoints?.find((endpoint) => endpoint.id === endpointId)

    if (!normalizedEndpoint) {
      return NextResponse.json({ error: 'Save this endpoint before sending a test' }, { status: 409 })
    }

    const resolved = await resolveIntegrationEndpoint(admin, project.id, type, normalizedEndpoint)
    const delivery = await sendTestWebhook(
      type,
      resolved.endpoint,
      { id: project.id, name: project.name },
      resolved.destinationHint,
    )
    return NextResponse.json(delivery)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
