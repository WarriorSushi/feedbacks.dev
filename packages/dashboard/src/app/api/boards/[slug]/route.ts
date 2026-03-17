import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  // Get board settings
  const { data: board, error: boardError } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (boardError || !board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  // Get public feedback for this project
  const { data: feedback, error: feedbackError } = await admin
    .from('feedback')
    .select('id, message, type, status, vote_count, created_at, email')
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .in('type', board.show_types || ['idea', 'bug'])
    .order('vote_count', { ascending: false })

  if (feedbackError) {
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })
  }

  // Strip emails from response
  const safeFeedback = (feedback || []).map(({ email, ...rest }) => rest)

  return NextResponse.json({
    board: {
      title: board.title,
      description: board.description,
      slug: board.slug,
      allow_submissions: board.allow_submissions,
      show_types: board.show_types,
      branding: board.branding,
      custom_css: board.custom_css,
    },
    feedback: safeFeedback,
  })
}
