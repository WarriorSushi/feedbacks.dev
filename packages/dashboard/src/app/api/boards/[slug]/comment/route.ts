import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Require authenticated user
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminSupabase()

  // Get board + verify ownership
  const { data: board } = await admin
    .from('public_board_settings')
    .select('project_id')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  // Verify user owns the project
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
  const { feedback_id, content } = body

  if (!feedback_id || !content?.trim() || content.trim().length < 1) {
    return NextResponse.json({ error: 'feedback_id and content are required' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 })
  }

  // Verify feedback belongs to this project
  const { data: feedback } = await admin
    .from('feedback')
    .select('id')
    .eq('id', feedback_id)
    .eq('project_id', board.project_id)
    .single()

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  // Insert public comment
  const { data: note, error: insertErr } = await admin
    .from('feedback_notes')
    .insert({
      feedback_id,
      user_id: user.id,
      content: content.trim(),
      is_public: true,
    })
    .select('id, content, created_at')
    .single()

  if (insertErr) {
    console.error('Comment insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
  }

  return NextResponse.json({ success: true, comment: note }, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  // Get board
  const { data: board } = await admin
    .from('public_board_settings')
    .select('project_id')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  // Get all public comments for feedback in this project
  const { data: comments } = await admin
    .from('feedback_notes')
    .select('id, feedback_id, content, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: true })

  // Filter to only comments on feedback belonging to this project
  // We need to join through feedback table
  const { data: projectFeedbackIds } = await admin
    .from('feedback')
    .select('id')
    .eq('project_id', board.project_id)

  const feedbackIdSet = new Set(projectFeedbackIds?.map((f) => f.id) || [])
  const filtered = (comments || []).filter((c) => feedbackIdSet.has(c.feedback_id))

  return NextResponse.json({ comments: filtered })
}
