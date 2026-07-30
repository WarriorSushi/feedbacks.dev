import { NextRequest, NextResponse } from 'next/server'
import { loadBoardDirectoryPage, type BoardSortMode } from '@/lib/board-discovery'

const VALID_SORTS = new Set<BoardSortMode>(['trending', 'active', 'responsive', 'shipping', 'new'])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const sortParam = searchParams.get('sort') || 'trending'
    const sort: BoardSortMode = VALID_SORTS.has(sortParam as BoardSortMode)
      ? (sortParam as BoardSortMode)
      : 'trending'
    const category = searchParams.get('category')?.trim().toLowerCase() || ''
    const search = searchParams.get('q')?.trim() || ''
    const cursor = searchParams.get('cursor')
    const directory = await loadBoardDirectoryPage({ sort, category, query: search, cursor })

    return NextResponse.json({
      boards: directory.entries,
      total: directory.total,
      nextCursor: directory.nextCursor,
      hasMore: directory.hasMore,
    }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } })
  } catch (error) {
    const invalidCursor = error instanceof Error && error.message === 'Invalid board directory cursor'
    return NextResponse.json(
      { error: invalidCursor ? 'Invalid pagination cursor' : 'Failed to load boards' },
      { status: invalidCursor ? 400 : 500 },
    )
  }
}
