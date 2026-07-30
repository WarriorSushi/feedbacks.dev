import { createAdminSupabase } from '@/lib/supabase-server'
import { parseBoardBranding, type BoardBranding } from '@/lib/public-board'

export type BoardSortMode = 'trending' | 'active' | 'responsive' | 'shipping' | 'new'

export interface BoardDirectoryEntry {
  id: string
  projectId: string
  slug: string
  title: string
  description: string
  displayName: string | null
  projectName: string
  createdAt: string
  updatedAt: string
  allowSubmissions: boolean
  showTypes: string[]
  branding: BoardBranding
  feedbackCount: number
  voteCount: number
  publicReplyCount: number
  recentlyShippedCount: number
  inProgressCount: number
  recentFeedbackCount: number
  recentActivityAt: string | null
  trustScore: number
  scores: Record<BoardSortMode, number>
}

export interface BoardDirectoryPage {
  entries: BoardDirectoryEntry[]
  total: number
  categories: Array<{ value: string; count: number }>
  totalRequests: number
  totalReplies: number
}

export function sortBoardDirectoryEntries(entries: BoardDirectoryEntry[], sort: BoardSortMode): BoardDirectoryEntry[] {
  return [...entries].sort((a, b) => {
    const diff = b.scores[sort] - a.scores[sort]
    if (diff !== 0) return diff
    return new Date(b.recentActivityAt || b.updatedAt).getTime() - new Date(a.recentActivityAt || a.updatedAt).getTime()
  })
}

export function recommendBoards(
  entries: BoardDirectoryEntry[],
  currentSlug: string,
  categories: string[] = [],
  limit = 3,
): BoardDirectoryEntry[] {
  const categorySet = new Set(categories)

  return [...entries]
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      entry,
      score:
        (entry.branding.categories?.filter((category) => categorySet.has(category)).length || 0) +
        entry.scores.active / 100 +
        entry.trustScore / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseDirectoryEntry(value: unknown): BoardDirectoryEntry | null {
  const raw = asRecord(value)
  const board = asRecord(raw.board)
  const id = typeof board.id === 'string' ? board.id : null
  const projectId = typeof board.project_id === 'string' ? board.project_id : null
  const slug = typeof board.slug === 'string' ? board.slug : null
  if (!id || !projectId || !slug) return null

  const projectName = typeof raw.projectName === 'string' ? raw.projectName : 'Untitled project'
  const createdAt = typeof board.created_at === 'string' ? board.created_at : new Date(0).toISOString()
  const updatedAt = typeof board.updated_at === 'string' ? board.updated_at : createdAt
  const sortScore = asNumber(raw.sortScore)
  const branding = parseBoardBranding(board)

  return {
    id,
    projectId,
    slug,
    title: typeof board.title === 'string' && board.title ? board.title : `${projectName} board`,
    description: typeof board.description === 'string' && board.description
      ? board.description
      : 'Vote on requests, track updates, and follow what ships next.',
    displayName: typeof board.display_name === 'string' ? board.display_name : null,
    projectName,
    createdAt,
    updatedAt,
    allowSubmissions: board.allow_submissions !== false,
    showTypes: Array.isArray(board.show_types)
      ? board.show_types.filter((type): type is string => typeof type === 'string')
      : ['idea', 'bug'],
    branding,
    feedbackCount: asNumber(raw.feedbackCount),
    voteCount: asNumber(raw.voteCount),
    publicReplyCount: asNumber(raw.publicReplyCount),
    recentlyShippedCount: asNumber(raw.recentlyShippedCount),
    inProgressCount: asNumber(raw.inProgressCount),
    recentFeedbackCount: asNumber(raw.recentFeedbackCount),
    recentActivityAt: typeof raw.recentActivityAt === 'string' ? raw.recentActivityAt : null,
    trustScore: asNumber(raw.trustScore),
    scores: {
      trending: sortScore,
      active: sortScore,
      responsive: sortScore,
      shipping: sortScore,
      new: sortScore,
    },
  }
}

export async function loadBoardDirectoryPage({
  sort = 'trending',
  category = '',
  query = '',
  page = 1,
  limit = 24,
}: {
  sort?: BoardSortMode
  category?: string
  query?: string
  page?: number
  limit?: number
} = {}): Promise<BoardDirectoryPage> {
  const admin = await createAdminSupabase()
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))
  const safePage = Math.max(1, Math.min(1000, Math.floor(page)))
  const { data, error } = await admin.rpc('get_public_board_directory', {
    p_sort: ['trending', 'active', 'responsive', 'shipping', 'new'].includes(sort) ? sort : 'trending',
    p_category: category || null,
    p_query: query || null,
    p_limit: safeLimit,
    p_offset: (safePage - 1) * safeLimit,
  })
  if (error) throw new Error(error.message)

  const payload = asRecord(data)
  const entries = Array.isArray(payload.entries)
    ? payload.entries.map(parseDirectoryEntry).filter((entry): entry is BoardDirectoryEntry => Boolean(entry))
    : []
  const categories = Array.isArray(payload.categories)
    ? payload.categories.map((entry) => {
        const categoryEntry = asRecord(entry)
        return {
          value: typeof categoryEntry.value === 'string' ? categoryEntry.value : '',
          count: asNumber(categoryEntry.count),
        }
      }).filter((entry) => entry.value)
    : []

  return {
    entries,
    categories,
    total: asNumber(payload.total),
    totalRequests: asNumber(payload.totalRequests),
    totalReplies: asNumber(payload.totalReplies),
  }
}

export async function loadBoardDirectoryEntries(): Promise<BoardDirectoryEntry[]> {
  const page = await loadBoardDirectoryPage({ sort: 'active', limit: 24 })
  return page.entries
}
