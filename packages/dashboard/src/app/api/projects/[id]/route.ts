import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { project, admin } = result

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
    if ('error' in result) return result.error

    const { admin } = result
    const body = await request.json()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) {
      const name = body.name?.trim()
      if (!name || name.length > 100) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      updates.name = name
    }
    if (body.domain !== undefined) updates.domain = body.domain?.trim() || null
    if (body.settings !== undefined) updates.settings = body.settings
    if (body.webhooks !== undefined) updates.webhooks = body.webhooks

    const { data, error } = await admin.from('projects').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { admin } = result

    // Delete feedback first, then project
    await admin.from('feedback').delete().eq('project_id', id)
    await admin.from('webhook_deliveries').delete().eq('project_id', id)
    const { error } = await admin.from('projects').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
