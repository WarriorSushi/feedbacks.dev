import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { isBoardPubliclyAccessible } from '@/lib/public-board'

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

  const body = await request.json().catch(() => ({}))
  const feedbackId = typeof body.feedback_id === 'string' ? body.feedback_id : null
  const watching = body?.watching !== false

  if (!feedbackId) {
    return NextResponse.json({ error: 'feedback_id is required' }, { status: 400 })
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

  const { data: feedback } = await admin
    .from('feedback')
    .select('id, project_id, is_public')
    .eq('id', feedbackId)
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .single()

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  if (watching) {
    const { error } = await admin
      .from('feedback_watches')
      .upsert(
        {
          board_id: board.id,
          project_id: board.project_id,
          feedback_id: feedbackId,
          user_id: user.id,
        },
        { onConflict: 'feedback_id,user_id', ignoreDuplicates: false },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from('feedback_watches')
      .delete()
      .eq('feedback_id', feedbackId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ watching, feedbackId })
}
