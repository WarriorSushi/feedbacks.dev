import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { buildSuggestionEntries } from '@/lib/board-submissions'
import { isBoardPubliclyAccessible } from '@/lib/public-board'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] })
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
    .select('id, message, status, vote_count')
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .limit(25)

  return NextResponse.json({
    suggestions: buildSuggestionEntries(query, feedback || []),
  })
}
