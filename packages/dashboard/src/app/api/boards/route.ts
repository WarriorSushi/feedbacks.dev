import { NextRequest, NextResponse } from 'next/server'
import { loadBoardDirectoryEntries, sortBoardDirectoryEntries, type BoardSortMode } from '@/lib/board-discovery'

const VALID_SORTS = new Set<BoardSortMode>(['trending', 'active', 'responsive', 'shipping', 'new'])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const sortParam = searchParams.get('sort') || 'trending'
    const sort: BoardSortMode = VALID_SORTS.has(sortParam as BoardSortMode)
      ? (sortParam as BoardSortMode)
      : 'trending'
    const category = searchParams.get('category')?.trim().toLowerCase() || ''
    const search = searchParams.get('q')?.trim().toLowerCase() || ''

    const entries = await loadBoardDirectoryEntries()

    let filtered = entries
    if (category) {
      filtered = filtered.filter((entry) => entry.branding.categories?.includes(category))
    }
    if (search) {
      filtered = filtered.filter(
        (entry) =>
          (entry.displayName || entry.title).toLowerCase().includes(search) ||
          entry.description.toLowerCase().includes(search) ||
          entry.projectName.toLowerCase().includes(search),
      )
    }

    const sorted = sortBoardDirectoryEntries(filtered, sort)

    return NextResponse.json({ boards: sorted })
  } catch {
    return NextResponse.json({ error: 'Failed to load boards' }, { status: 500 })
  }
}
