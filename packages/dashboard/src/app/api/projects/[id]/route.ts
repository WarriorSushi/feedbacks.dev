import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

type RouteParams = { params: Promise<{ id: string }> }

async function getAuthedUserAndProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  return { user, project, admin }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result && !('admin' in result)) return result.error

    const { project, admin } = result as Exclude<typeof result, { error: NextResponse }>

    // Get feedback stats
    const { count: totalFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    const { count: newFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'new')

    const { data: avgData } = await admin
      .rpc('avg_rating_for_project', { p_project_id: id })

    return NextResponse.json({
      ...project,
      stats: {
        totalFeedback: totalFeedback ?? 0,
        newFeedback: newFeedback ?? 0,
        avgRating: avgData ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result && !('admin' in result)) return result.error

    const { admin } = result as Exclude<typeof result, { error: NextResponse }>

    // Limit request body size
    const rawBody = await request.text()
    if (rawBody.length > 50_000) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 400 })
    }
    const body = JSON.parse(rawBody)

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) {
      const name = body.name?.trim()
      if (!name || name.length > 100) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      updates.name = name
    }
    if (body.domain !== undefined) updates.domain = body.domain?.trim() || null

    // Validate settings is a plain object
    if (body.settings !== undefined) {
      if (typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings)) {
        return NextResponse.json({ error: 'settings must be a plain object' }, { status: 400 })
      }
      updates.settings = body.settings
    }

    // Validate webhooks is a plain object
    if (body.webhooks !== undefined) {
      if (typeof body.webhooks !== 'object' || body.webhooks === null || Array.isArray(body.webhooks)) {
        return NextResponse.json({ error: 'webhooks must be a plain object' }, { status: 400 })
      }
      updates.webhooks = body.webhooks
    }

    const { data, error } = await admin.from('projects').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result && !('admin' in result)) return result.error

    const { admin } = result as Exclude<typeof result, { error: NextResponse }>

    // Rely on CASCADE for related records (feedback, webhook_deliveries, etc.)
    const { error } = await admin.from('projects').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
