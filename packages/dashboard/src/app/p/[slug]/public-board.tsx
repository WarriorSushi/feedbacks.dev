'use client'

import * as React from 'react'
import Link from 'next/link'
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
import { BoardFooter } from '@/components/boards/BoardFooter'

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_42%,_#f8fafc_100%)]">
      {board.customCss ? <style>{board.customCss}</style> : null}
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Your feedback was submitted. It now enters the same public flow as the rest of the
            board.
          </div>
        )}

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
              voting={votingId === item.id}
              canModerate={canModerate}
              replyDraft={replyDrafts[item.id] || ''}
              busy={busyId === item.id}
              onVote={() => handleVote(item.id)}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
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

        {recommendations.length > 0 && (
          <section className="rounded-3xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Explore more
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Related product boards
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommendations.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/p/${entry.slug}`}
                  className="rounded-2xl border border-border bg-muted/50 p-4 transition hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{
                        backgroundColor: entry.branding.accentColor || '#0f766e',
                      }}
                    >
                      {entry.branding.logoEmoji ||
                        entry.title.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {entry.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.feedbackCount} requests &middot; trust{' '}
                        {entry.trustScore}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {entry.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <BoardFooter canModerate={canModerate} projectId={board.projectId} />
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
