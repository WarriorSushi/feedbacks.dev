import { createAdminSupabase } from '@/lib/supabase-server'
import { isBoardListedInDirectory, parseBoardBranding, type BoardBranding } from '@/lib/public-board'

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

interface FeedbackRow {
  id: string
  project_id: string
  vote_count: number
  status: string
  created_at: string
}

interface CommentRow {
  feedback_id: string
  created_at: string
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function calcTrustScore({
  feedbackCount,
  publicReplyCount,
  recentlyShippedCount,
  inProgressCount,
}: {
  feedbackCount: number
  publicReplyCount: number
  recentlyShippedCount: number
  inProgressCount: number
}) {
  const replyScore = feedbackCount > 0 ? Math.min(35, Math.round((publicReplyCount / feedbackCount) * 40)) : 0
  return Math.min(
    100,
    20 + Math.min(20, feedbackCount * 3) + replyScore + Math.min(15, recentlyShippedCount * 5) + Math.min(10, inProgressCount * 4),
  )
}

function calcScores({
  feedbackCount,
  voteCount,
  publicReplyCount,
  recentlyShippedCount,
  inProgressCount,
  recentFeedbackCount,
  createdAt,
  recentActivityAt,
}: {
  feedbackCount: number
  voteCount: number
  publicReplyCount: number
  recentlyShippedCount: number
  inProgressCount: number
  recentFeedbackCount: number
  createdAt: string
  recentActivityAt: string | null
}): Record<BoardSortMode, number> {
  const createdTime = new Date(createdAt).getTime()
  const recentActivityTime = recentActivityAt ? new Date(recentActivityAt).getTime() : createdTime
  const agePenalty = Math.max(1, (Date.now() - createdTime) / (1000 * 60 * 60 * 24 * 14))
  const activityFreshness = Math.max(1, (Date.now() - recentActivityTime) / (1000 * 60 * 60 * 24 * 7))

  return {
    trending: Math.round(((recentFeedbackCount * 4) + (voteCount * 0.3) + (publicReplyCount * 2)) / activityFreshness),
    active: Math.round(((feedbackCount * 2) + publicReplyCount + recentFeedbackCount) / activityFreshness),
    responsive: Math.round((publicReplyCount * 5) + (inProgressCount * 3) + recentlyShippedCount),
    shipping: Math.round((recentlyShippedCount * 6) + (inProgressCount * 3) + (publicReplyCount * 0.5)),
    new: Math.round(10_000_000_000 / agePenalty),
  }
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
        entry.branding.categories?.filter((category) => categorySet.has(category)).length || 0 +
        entry.scores.active / 100 +
        entry.trustScore / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry)
}

export async function loadBoardDirectoryEntries(): Promise<BoardDirectoryEntry[]> {
  const admin = await createAdminSupabase()
  const { data: boards } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('enabled', true)

  if (!boards || boards.length === 0) return []

  const visibleBoards = boards.filter((board) => isBoardListedInDirectory(board))
  const projectIds = [...new Set(visibleBoards.map((board) => board.project_id))]
  if (projectIds.length === 0) return []

  const { data: projects } = await admin
    .from('projects')
    .select('id, name')
    .in('id', projectIds)

  const projectNames = new Map((projects || []).map((project) => [project.id, project.name]))

  const { data: feedback } = await admin
    .from('feedback')
    .select('id, project_id, vote_count, status, created_at')
    .in('project_id', projectIds)
    .eq('is_public', true)
    .eq('is_archived', false)

  const feedbackRows = (feedback || []) as FeedbackRow[]
  const feedbackByProject = new Map<string, FeedbackRow[]>()
  const feedbackProjectLookup = new Map<string, string>()

  feedbackRows.forEach((row) => {
    feedbackProjectLookup.set(row.id, row.project_id)
    const items = feedbackByProject.get(row.project_id) || []
    items.push(row)
    feedbackByProject.set(row.project_id, items)
  })

  const feedbackIds = feedbackRows.map((row) => row.id)
  let comments: CommentRow[] = []
  if (feedbackIds.length > 0) {
    const { data: commentRows } = await admin
      .from('feedback_notes')
      .select('feedback_id, created_at')
      .eq('is_public', true)
      .in('feedback_id', feedbackIds)

    comments = (commentRows || []) as CommentRow[]
  }

  const commentsByProject = new Map<string, CommentRow[]>()
  comments.forEach((row) => {
    const projectId = feedbackProjectLookup.get(row.feedback_id)
    if (!projectId) return
    const items = commentsByProject.get(projectId) || []
    items.push(row)
    commentsByProject.set(projectId, items)
  })

  const recentCutoff = daysAgo(14)

  return visibleBoards.map((board) => {
    const branding = parseBoardBranding(board)
    const boardFeedback = feedbackByProject.get(board.project_id) || []
    const boardComments = commentsByProject.get(board.project_id) || []
    const recentFeedbackCount = boardFeedback.filter((row) => new Date(row.created_at).getTime() >= recentCutoff).length
    const voteCount = boardFeedback.reduce((sum, row) => sum + (row.vote_count || 0), 0)
    const publicReplyCount = boardComments.length
    const recentlyShippedCount = boardFeedback.filter((row) => row.status === 'closed').length
    const inProgressCount = boardFeedback.filter((row) => row.status === 'in_progress').length
    const recentActivityCandidates = [
      ...boardFeedback.map((row) => row.created_at),
      ...boardComments.map((row) => row.created_at),
    ]
    const recentActivityAt = recentActivityCandidates.sort().at(-1) || null
    const trustScore = calcTrustScore({
      feedbackCount: boardFeedback.length,
      publicReplyCount,
      recentlyShippedCount,
      inProgressCount,
    })

    return {
      id: board.id,
      projectId: board.project_id,
      slug: board.slug,
      title: board.title || `${projectNames.get(board.project_id) || 'Product'} board`,
      description: board.description || 'Vote on requests, track updates, and follow what ships next.',
      displayName: board.display_name || null,
      projectName: projectNames.get(board.project_id) || 'Untitled project',
      createdAt: board.created_at,
      updatedAt: board.updated_at,
      allowSubmissions: board.allow_submissions,
      showTypes: board.show_types || ['idea', 'bug'],
      branding,
      feedbackCount: boardFeedback.length,
      voteCount,
      publicReplyCount,
      recentlyShippedCount,
      inProgressCount,
      recentFeedbackCount,
      recentActivityAt,
      trustScore,
      scores: calcScores({
        feedbackCount: boardFeedback.length,
        voteCount,
        publicReplyCount,
        recentlyShippedCount,
        inProgressCount,
        recentFeedbackCount,
        createdAt: board.created_at,
        recentActivityAt,
      }),
    }
  })
}
