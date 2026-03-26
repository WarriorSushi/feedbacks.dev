import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import type { BoardReport } from '@/lib/types'

type RouteParams = { params: Promise<{ id: string; reportId: string }> }

const VALID_STATUSES: BoardReport['status'][] = ['open', 'reviewed', 'resolved', 'dismissed']

async function getOwnedProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('id, owner_user_id')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) {
    return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  }

  return { admin, project }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, reportId } = await params
    const result = await getOwnedProject(id)
    if ('error' in result && !('project' in result)) return result.error
    const { admin } = result as Exclude<typeof result, { error: NextResponse }>

    const body = await request.json().catch(() => ({}))
    const status = typeof body.status === 'string' ? body.status : ''
    if (!VALID_STATUSES.includes(status as BoardReport['status'])) {
      return NextResponse.json({ error: 'Invalid report status' }, { status: 400 })
    }

    const { data: report, error } = await admin
      .from('board_reports')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('project_id', id)
      .select('id, board_id, project_id, feedback_id, user_id, reporter_email, target_type, reason, details, status, created_at, updated_at')
      .single()

    if (error || !report) {
      return NextResponse.json({ error: error?.message || 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
