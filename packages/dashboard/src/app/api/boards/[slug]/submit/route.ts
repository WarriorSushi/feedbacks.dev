import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { assertCanReceiveFeedback, incrementFeedbackUsage } from '@/lib/billing'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'
import { checkRateLimit } from '@/lib/rate-limit'
import { buildSuggestionEntries, isLikelySpam, normalizeBoardMessageTitle } from '@/lib/board-submissions'
import { isBoardPubliclyAccessible } from '@/lib/public-board'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  // Rate limit
  const { allowed } = await checkRateLimit(req, 'board-submit', 5, 5)

  if (!allowed) {
    return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 })
  }

  // Validate board
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  if (!board.allow_submissions) {
    return NextResponse.json({ error: 'Submissions are disabled' }, { status: 403 })
  }

  const body = await req.json()
  const { message, type, email, hp } = body

  const { data: projectOwner } = await admin
    .from('projects')
    .select('owner_user_id')
    .eq('id', board.project_id)
    .single()

  const entitlement = projectOwner
    ? await assertCanReceiveFeedback(projectOwner.owner_user_id)
    : null

  if (entitlement && !entitlement.allowed) {
    return NextResponse.json({ error: entitlement.message, code: entitlement.code }, { status: 403 })
  }

  if (typeof hp === 'string' && hp.trim().length > 0) {
    return NextResponse.json({ error: 'Submission rejected' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return NextResponse.json({ error: 'Message must be at least 5 characters' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
  }

  // Validate email if provided
  const trimmedEmail = email?.trim() || null
  if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  if (isLikelySpam(message)) {
    return NextResponse.json({ error: 'This message looks automated or overly repetitive. Please rewrite it more clearly.' }, { status: 400 })
  }

  const allowedTypes = board.show_types || ['idea', 'bug']
  const feedbackType = allowedTypes.includes(type) ? type : allowedTypes[0]
  const normalizedTitle = normalizeBoardMessageTitle(message)

  const { data: existingFeedback } = await admin
    .from('feedback')
    .select('id, message, status, vote_count')
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .order('vote_count', { ascending: false })
    .limit(25)

  const suggestions = buildSuggestionEntries(message, existingFeedback || [])
  const exactDuplicate = (existingFeedback || []).find(
    (entry) => normalizeBoardMessageTitle(entry.message) === normalizedTitle,
  )

  if (exactDuplicate) {
    return NextResponse.json({
      error: 'A very similar request already exists. Vote on it instead or rewrite your submission if this is meaningfully different.',
      suggestions,
    }, { status: 409 })
  }

  const { data: feedback, error } = await admin
    .from('feedback')
    .insert({
      project_id: board.project_id,
      message: message.trim(),
      type: feedbackType,
      email: trimmedEmail,
      url: null,
      user_agent: 'public-board',
      status: 'new',
      priority: 'low',
      tags: [],
      metadata: {},
      is_public: true,
      vote_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }

  if (projectOwner?.owner_user_id) {
    await incrementFeedbackUsage(projectOwner.owner_user_id)
    void notifyProjectOwnerOfNewFeedback(
      { id: board.project_id, name: board.title || board.display_name || slug, owner_user_id: projectOwner.owner_user_id },
      {
        message: message.trim(),
        type: feedbackType,
        email: trimmedEmail,
        url: null,
        rating: null,
        created_at: new Date().toISOString(),
      },
    )
  }

  return NextResponse.json({ id: feedback.id, success: true, suggestions })
}
