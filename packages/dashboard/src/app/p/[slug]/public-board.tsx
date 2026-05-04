'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { BoardAnnouncement } from '@/lib/public-board'
import {
  type BoardInfo,
  type FeedbackItem,
  type AdminComment,
  type BoardRecommendation,
  type ReportTarget,
  type SortMode,
  type FilterType,
  readSetStorage,
  writeSetStorage,
} from '@/components/boards/board-types'
import { BoardHero } from '@/components/boards/BoardHero'
import { BoardAnnouncements } from '@/components/boards/BoardAnnouncements'
import { BoardFilters } from '@/components/boards/BoardFilters'
import { BoardFeedbackList } from '@/components/boards/BoardFeedbackList'
import { BoardFeedbackCard } from '@/components/boards/BoardFeedbackCard'
import { BoardSubmitForm } from '@/components/boards/BoardSubmitForm'
import { BoardReportModal } from '@/components/boards/BoardReportModal'

export function PublicBoard({
  board,
  initialFeedback,
  initialComments = [],
  initialAnnouncements = [],
  canModerate = false,
  viewerSignedIn = false,
  initialFollowed = false,
  initialWatchedIds = [],
  recommendations = [],
}: {
  board: BoardInfo
  initialFeedback: FeedbackItem[]
  initialComments?: AdminComment[]
  initialAnnouncements?: BoardAnnouncement[]
  canModerate?: boolean
  viewerSignedIn?: boolean
  initialFollowed?: boolean
  initialWatchedIds?: string[]
  recommendations?: BoardRecommendation[]
}) {
  const [feedback, setFeedback] = React.useState(initialFeedback)
  const [comments, setComments] = React.useState(initialComments)
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [sort, setSort] = React.useState<SortMode>('votes')
  const [search, setSearch] = React.useState('')
  const [votedIds, setVotedIds] = React.useState<Set<string>>(new Set())
  const [watchedIds, setWatchedIds] = React.useState<Set<string>>(new Set(initialWatchedIds))
  const [followed, setFollowed] = React.useState(initialFollowed)
  const [votingId, setVotingId] = React.useState<string | null>(null)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [showSubmit, setShowSubmit] = React.useState(false)
  const [reportTarget, setReportTarget] = React.useState<ReportTarget | null>(null)
  const [justSubmitted, setJustSubmitted] = React.useState(false)
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({})
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [showRecommendations, setShowRecommendations] = React.useState(false)
  const votesKey = `votes:${board.slug}`

  const commentsByFeedback = React.useMemo(() => {
    const map: Record<string, AdminComment[]> = {}
    comments.forEach((comment) => {
      if (!map[comment.feedback_id]) map[comment.feedback_id] = []
      map[comment.feedback_id].push(comment)
    })
    return map
  }, [comments])

  React.useEffect(() => {
    setVotedIds(readSetStorage(votesKey))
  }, [votesKey])

  React.useEffect(() => {
    setReady(true)
  }, [])

  const totalVotes = React.useMemo(
    () => feedback.reduce((sum, item) => sum + item.vote_count, 0),
    [feedback],
  )

  const redirectToAuth = () => {
    const redirect = encodeURIComponent(`/p/${board.slug}`)
    window.location.href = `/auth?redirect=${redirect}`
  }

  const toggleFollowed = async () => {
    const next = !followed
    const response = await fetch(`/api/boards/${board.slug}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following: next }),
    })

    if (response.status === 401) {
      redirectToAuth()
      return
    }

    if (!response.ok) {
      window.alert('Could not update your board follow right now.')
      return
    }

    setFollowed(next)
  }

  const toggleWatched = async (feedbackId: string) => {
    const next = new Set(watchedIds)
    const watching = !next.has(feedbackId)
    const response = await fetch(`/api/boards/${board.slug}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, watching }),
    })

    if (response.status === 401) {
      redirectToAuth()
      return
    }

    if (!response.ok) {
      window.alert('Could not update your watch right now.')
      return
    }

    if (watching) next.add(feedbackId)
    else next.delete(feedbackId)
    setWatchedIds(next)
  }

  const handleVote = async (feedbackId: string) => {
    if (votingId) return
    setVotingId(feedbackId)
    try {
      const response = await fetch(`/api/boards/${board.slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId }),
      })
      if (!response.ok) return
      const data = await response.json()
      setFeedback((prev) =>
        prev.map((entry) =>
          entry.id === feedbackId
            ? { ...entry, vote_count: entry.vote_count + (data.voted ? 1 : -1) }
            : entry,
        ),
      )
      const next = new Set(votedIds)
      if (data.voted) next.add(feedbackId)
      else next.delete(feedbackId)
      setVotedIds(next)
      writeSetStorage(votesKey, next)
    } finally {
      setVotingId(null)
    }
  }

  const refreshBoard = async () => {
    const response = await fetch(`/api/boards/${board.slug}`)
    if (!response.ok) return
    const data = await response.json()
    if (data.feedback) setFeedback(data.feedback)
    if (data.comments) setComments(data.comments)
  }

  const handleSubmitted = async () => {
    setShowSubmit(false)
    setJustSubmitted(true)
    setTimeout(() => setJustSubmitted(false), 4000)
    await refreshBoard()
  }

  const handleReplySubmit = async (feedbackId: string) => {
    const draft = replyDrafts[feedbackId]?.trim()
    if (!draft) return
    setBusyId(feedbackId)
    try {
      const response = await fetch(`/api/boards/${board.slug}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, content: draft }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to post reply')
      setComments((prev) => [
        ...prev,
        {
          id: data.comment.id,
          feedback_id: feedbackId,
          content: data.comment.content,
          created_at: data.comment.created_at,
        },
      ])
      setReplyDrafts((prev) => ({ ...prev, [feedbackId]: '' }))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to post public reply')
    } finally {
      setBusyId(null)
    }
  }

  const handleModeration = async (
    feedbackId: string,
    action: 'status' | 'hide',
    value?: string,
  ) => {
    setBusyId(feedbackId)
    try {
      const response = await fetch(`/api/boards/${board.slug}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, action, value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update board item')
      if (action === 'hide')
        setFeedback((prev) => prev.filter((entry) => entry.id !== feedbackId))
      else if (action === 'status' && value)
        setFeedback((prev) =>
          prev.map((entry) =>
            entry.id === feedbackId ? { ...entry, status: value } : entry,
          ),
        )
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to update board item')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = React.useMemo(() => {
    let items = feedback
    if (filter !== 'all') items = items.filter((entry) => entry.type === filter)
    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter((entry) => entry.message.toLowerCase().includes(query))
    }
    const next = [...items]
    if (sort === 'votes') next.sort((a, b) => b.vote_count - a.vote_count)
    else if (sort === 'newest')
      next.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    else {
      const order: Record<string, number> = {
        in_progress: 0,
        planned: 1,
        reviewed: 2,
        new: 3,
        closed: 4,
      }
      next.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))
    }
    return next
  }, [feedback, filter, search, sort])

  return (
    <div
      data-public-board-ready={ready ? 'true' : 'false'}
      className="min-h-screen bg-[linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]"
    >
      {board.customCss ? <style>{board.customCss}</style> : null}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <BoardHero
          board={board}
          feedbackCount={feedback.length}
          totalVotes={totalVotes}
          followed={followed}
          viewerSignedIn={viewerSignedIn}
          canModerate={canModerate}
          projectId={board.projectId}
          onFollowToggle={() => void toggleFollowed()}
          onSubmitClick={() => setShowSubmit(true)}
        />

        <BoardAnnouncements announcements={initialAnnouncements} />

        {justSubmitted && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Your feedback was submitted. It now enters the same public flow as the rest of the
            board.
          </div>
        )}

        <main className="space-y-4" aria-label="Public feedback requests">
          <BoardFilters
            showTypes={board.show_types}
            filter={filter}
            sort={sort}
            search={search}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onSearchChange={setSearch}
          />

          <BoardFeedbackList
            emptyTitle={board.branding.emptyStateTitle || 'No public requests yet'}
            emptyDescription={
              board.branding.emptyStateDescription ||
              'Be the first person to submit something the team can respond to publicly.'
            }
            searchQuery={search}
            isEmpty={filtered.length === 0}
          >
            {filtered.map((item) => (
              <BoardFeedbackCard
                key={item.id}
                item={item}
                comments={commentsByFeedback[item.id] || []}
                isExpanded={expandedId === item.id}
                voted={votedIds.has(item.id)}
                watched={watchedIds.has(item.id)}
                voting={votingId === item.id}
                canModerate={canModerate}
                replyDraft={replyDrafts[item.id] || ''}
                busy={busyId === item.id}
                onVote={() => handleVote(item.id)}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onToggleWatch={() => void toggleWatched(item.id)}
                onOpenReport={() =>
                  setReportTarget({ type: 'feedback', feedbackId: item.id })
                }
                onReplyDraftChange={(value) =>
                  setReplyDrafts((prev) => ({ ...prev, [item.id]: value }))
                }
                onReplySubmit={() => void handleReplySubmit(item.id)}
                onStatusChange={(status) =>
                  void handleModeration(item.id, 'status', status)
                }
                onHide={() => void handleModeration(item.id, 'hide')}
              />
            ))}
          </BoardFeedbackList>
        </main>

        {recommendations.length > 0 && (
          <section className="rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Other public boards
                </p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  Explore related boards when you are done here
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowRecommendations((value) => !value)}
                aria-expanded={showRecommendations}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {showRecommendations ? 'Hide other boards' : 'View other public boards'}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showRecommendations ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {showRecommendations && (
              <div className="grid gap-3 border-t border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/p/${entry.slug}`}
                    className="group rounded-xl border border-border/70 bg-background px-4 py-4 transition-colors hover:border-foreground/25 hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground">
                        {entry.branding.logoEmoji || entry.title.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {entry.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {entry.feedbackCount} requests
                          {entry.trustScore >= 70
                            ? ' · responsive'
                            : entry.trustScore >= 45
                              ? ' · active'
                              : ' · new'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground/68">
                      {entry.description}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {showSubmit && (
        <BoardSubmitForm
          slug={board.slug}
          showTypes={board.show_types}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => void handleSubmitted()}
        />
      )}
      {reportTarget && (
        <BoardReportModal
          slug={board.slug}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
