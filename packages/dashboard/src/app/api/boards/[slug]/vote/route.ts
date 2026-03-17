import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit votes: 30 per minute
  const { allowed } = await checkRateLimit(ip + ':vote', 30, 1)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Hash the IP for privacy
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + '_feedbacks_vote_salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const voterIdentifier = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Validate board exists
  const { data: board } = await admin
    .from('public_board_settings')
    .select('project_id')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  const body = await req.json()
  const { feedback_id } = body

  if (!feedback_id) {
    return NextResponse.json({ error: 'feedback_id required' }, { status: 400 })
  }

  // Verify feedback belongs to this project and is public
  const { data: feedback } = await admin
    .from('feedback')
    .select('id, project_id, is_public')
    .eq('id', feedback_id)
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .single()

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  // Check if already voted
  const { data: existingVote } = await admin
    .from('votes')
    .select('id')
    .eq('feedback_id', feedback_id)
    .eq('voter_identifier', voterIdentifier)
    .single()

  if (existingVote) {
    // Remove vote (toggle off)
    await admin.from('votes').delete().eq('id', existingVote.id)
    return NextResponse.json({ voted: false })
  }

  // Insert upvote
  const { error } = await admin.from('votes').insert({
    feedback_id,
    voter_identifier: voterIdentifier,
    vote_type: 'up',
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  return NextResponse.json({ voted: true })
}
