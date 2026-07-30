import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { isBoardPubliclyAccessible } from '@/lib/public-board'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'

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
  const rate = await checkRateLimit(request, 'board-follow', 10, 10, `${slug}:${user.id}`)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many follow changes. Try again later.' },
      { status: 429, headers: { 'Retry-After': '600' } },
    )
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

  const bodyResult = await readJsonBody<{ following?: boolean }>(request)
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
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
      return NextResponse.json({ code: 'follow_update_failed', error: 'Could not update this board follow right now.' }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from('board_follows')
      .delete()
      .eq('board_id', board.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ code: 'follow_update_failed', error: 'Could not update this board follow right now.' }, { status: 500 })
    }
  }

  return NextResponse.json({ following })
}
