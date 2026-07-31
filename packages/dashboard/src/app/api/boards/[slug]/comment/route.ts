import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { isBoardPubliclyAccessible } from '@/lib/public-board'
import { notifyPublicBoardSubscribersOfTeamReply } from '@/lib/notifications'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'

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
  const rate = await checkRateLimit(request, 'board-comment', 20, 5, `${slug}:${user.id}`)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many replies. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': '300' } },
    )
  }

  const admin = await createAdminSupabase()

  // Get board + verify ownership
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  // Verify user owns the project
  const { data: project } = await admin
    .from('projects')
    .select('id, owner_user_id')
    .eq('id', board.project_id)
    .eq('owner_user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const bodyResult = await readJsonBody<{ feedback_id?: string; content?: string }>(request)
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
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
    .select('id, message, status')
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

  void notifyPublicBoardSubscribersOfTeamReply({
    board: {
      id: board.id,
      slug: board.slug,
      title: board.title,
      display_name: board.display_name,
    },
    feedback,
    replyContent: content.trim(),
    actorUserId: user.id,
  })

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
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  // Keep the public read project-scoped in SQL. Never load every public note
  // into application memory as the product grows.
  const { data: comments, error: commentsError } = await admin
    .from('feedback_notes')
    .select('id, feedback_id, content, created_at, feedback!inner(project_id, is_public)')
    .eq('is_public', true)
    .eq('feedback.project_id', board.project_id)
    .eq('feedback.is_public', true)
    .order('created_at', { ascending: true })
    .limit(500)

  if (commentsError) {
    return NextResponse.json({ error: 'Comments could not be loaded.' }, { status: 500 })
  }
  const filtered = (comments || []).map((comment) => ({
    id: comment.id,
    feedback_id: comment.feedback_id,
    content: comment.content,
    created_at: comment.created_at,
  }))

  return NextResponse.json({ comments: filtered })
}
