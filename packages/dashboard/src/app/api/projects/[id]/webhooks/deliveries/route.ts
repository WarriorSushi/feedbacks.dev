import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { assertFeatureAccess } from '@/lib/billing'
import { listWebhookEndpointStates, normalizeWebhookConfig } from '@/lib/webhook-config'

type RouteParams = { params: Promise<{ id: string }> }

async function getAuthedProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('id, webhooks, owner_user_id')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  const feature = await assertFeatureAccess(user.id, 'webhooks', user.email)
  if (!feature.allowed) {
    return {
      error: NextResponse.json({ error: feature.message, code: feature.code }, { status: 403 }),
    }
  }
  return { project, admin }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('admin' in result)) return result.error

    const { project, admin } = result as Exclude<typeof result, { error: NextResponse }>
    const normalized = normalizeWebhookConfig(project.webhooks)
    const { data: deliveries, error } = await admin
      .from('webhook_deliveries')
      .select('id, event, kind, url, status, status_code, response_body, attempt, payload, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const recentDeliveries = deliveries || []
    const health = listWebhookEndpointStates(normalized, recentDeliveries)

    return NextResponse.json({
      deliveries: recentDeliveries,
      health,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
