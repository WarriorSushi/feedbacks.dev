import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { isBoardPubliclyAccessible } from '@/lib/public-board'
import { getPrivacySalt } from '@/lib/privacy-salts'
import { readJsonBody } from '@/lib/api-request'
import { getOrCreateVoterDevice, getVoterIdentifier, VOTER_COOKIE } from '@/lib/voter-device'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  // Rate limit votes: 30 per minute
  const { allowed } = await checkRateLimit(req, 'vote', 30, 1, slug)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  let salt: string
  try {
    salt = getPrivacySalt('VOTE_HMAC_SECRET', '_feedbacks_vote_salt')
  } catch {
    return NextResponse.json({ error: 'Vote hashing is not configured' }, { status: 500 })
  }
  const voterDevice = await getOrCreateVoterDevice(req, salt)
  const voterIdentifier = await getVoterIdentifier(voterDevice.id, slug, salt)

  // Validate board exists
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  const bodyResult = await readJsonBody<{ feedback_id?: string }>(req)
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
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
    const response = NextResponse.json({ voted: false })
    if (voterDevice.isNew) {
      response.cookies.set(VOTER_COOKIE.name, voterDevice.cookieValue, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: VOTER_COOKIE.maxAge,
      })
    }
    return response
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

  const response = NextResponse.json({ voted: true })
  if (voterDevice.isNew) {
    response.cookies.set(VOTER_COOKIE.name, voterDevice.cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: VOTER_COOKIE.maxAge,
    })
  }
  return response
}
