import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

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
    .select('project_id, allow_submissions, show_types')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  if (!board.allow_submissions) {
    return NextResponse.json({ error: 'Submissions are disabled' }, { status: 403 })
  }

  const body = await req.json()
  const { message, type, email } = body

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

  const allowedTypes = board.show_types || ['idea', 'bug']
  const feedbackType = allowedTypes.includes(type) ? type : allowedTypes[0]

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
      is_public: true,
      vote_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }

  return NextResponse.json({ id: feedback.id, success: true })
}
