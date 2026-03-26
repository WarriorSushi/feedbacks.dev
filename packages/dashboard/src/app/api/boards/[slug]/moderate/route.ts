import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { isBoardPubliclyAccessible } from '@/lib/public-board'

const ALLOWED_STATUSES = new Set(['new', 'reviewed', 'planned', 'in_progress', 'closed'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminSupabase()
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', board.project_id)
    .eq('owner_user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const body = await request.json()
  const { feedback_id, action, value } = body as {
    feedback_id?: string
    action?: 'status' | 'hide'
    value?: string
  }

  if (!feedback_id || !action) {
    return NextResponse.json({ error: 'feedback_id and action are required' }, { status: 400 })
  }

  const { data: feedback } = await admin
    .from('feedback')
    .select('id')
    .eq('id', feedback_id)
    .eq('project_id', board.project_id)
    .single()

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  if (action === 'hide') {
    const { error } = await admin
      .from('feedback')
      .update({ is_public: false, updated_at: new Date().toISOString() })
      .eq('id', feedback_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to hide feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!value || !ALLOWED_STATUSES.has(value)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await admin
    .from('feedback')
    .update({ status: value, updated_at: new Date().toISOString() })
    .eq('id', feedback_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
