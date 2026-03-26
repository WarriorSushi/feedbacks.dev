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

  const body = await request.json().catch(() => ({}))
  const following = body?.following !== false

  if (following) {
    const { error } = await admin
      .from('board_follows')
      .upsert(
        {
          board_id: board.id,
          project_id: board.project_id,
          user_id: user.id,
        },
        { onConflict: 'board_id,user_id', ignoreDuplicates: false },
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from('board_follows')
      .delete()
      .eq('board_id', board.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ following })
}
