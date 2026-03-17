'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ---------- Types ----------
interface BoardInfo {
  title: string | null
  description: string | null
  slug: string
  allow_submissions: boolean
  show_types: string[]
  branding: Record<string, string> | null
}

interface FeedbackItem {
  id: string
  message: string
  type: string | null
  status: string
  vote_count: number
  created_at: string
}

type SortMode = 'votes' | 'newest' | 'status'
type FilterType = 'all' | 'idea' | 'bug' | 'praise' | 'question'

// ---------- Helpers ----------
const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  idea: { label: 'Feature', icon: '💡', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  bug: { label: 'Bug', icon: '🐛', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  praise: { label: 'Praise', icon: '⭐', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  question: { label: 'Question', icon: '❓', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  reviewed: { label: 'Under Review', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
  planned: { label: 'Planned', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  in_progress: { label: 'In Progress', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  closed: { label: 'Done', color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
}

function getTitle(message: string): string {
  const firstLine = message.split('\n')[0]
  return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine
}

function getDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  const rest = lines.slice(1).join(' ').trim()
  return rest.length > 150 ? rest.slice(0, 150) + '…' : rest
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------- Components ----------
function UpvoteButton({
  count,
  voted,
  onClick,
  loading,
}: {
  count: number
  voted: boolean
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'group flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 min-w-[56px] transition-all duration-200 select-none',
        voted
          ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-400'
          : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-600',
        loading && 'opacity-60 cursor-not-allowed',
        !loading && 'active:scale-95'
      )}
    >
      <svg
        className={cn(
          'h-4 w-4 mb-0.5 transition-transform duration-200',
          !loading && 'group-hover:-translate-y-0.5',
          voted && 'fill-current'
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </button>
  )
}

function FeedbackCard({
  item,
  voted,
  onVote,
  votingId,
}: {
  item: FeedbackItem
  voted: boolean
  onVote: (id: string) => void
  votingId: string | null
}) {
  const type = item.type ? typeConfig[item.type] : null
  const status = statusConfig[item.status] || statusConfig.new

  return (
    <div className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <UpvoteButton
        count={item.vote_count}
        voted={voted}
        onClick={() => onVote(item.id)}
        loading={votingId === item.id}
      />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {getTitle(item.message)}
        </h3>
        {getDescription(item.message) && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {getDescription(item.message)}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {type && (
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', type.color)}>
              <span>{type.icon}</span> {type.label}
            </span>
          )}
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', status.color)}>
            {status.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {relativeTime(item.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

function SubmitModal({
  slug,
  showTypes,
  onClose,
  onSubmitted,
}: {
  slug: string
  showTypes: string[]
  onClose: () => void
  onSubmitted: () => void
}) {
  const [message, setMessage] = React.useState('')
  const [type, setType] = React.useState(showTypes[0] || 'idea')
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch(`/api/boards/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type, email: email || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Submit Feedback</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Share your ideas or report bugs. The community will vote!
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {showTypes.map((t) => {
                const cfg = typeConfig[t]
                if (!cfg) return null
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                      type === t
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
                    )}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your feedback
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="First line becomes the title. Add details below..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 resize-none"
              required
              minLength={5}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className={cn(
                'flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]',
                (submitting || message.trim().length < 5) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------- Main Board ----------
export function PublicBoard({
  board,
  initialFeedback,
}: {
  board: BoardInfo
  initialFeedback: FeedbackItem[]
}) {
  const [feedback, setFeedback] = React.useState(initialFeedback)
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [sort, setSort] = React.useState<SortMode>('votes')
  const [votedIds, setVotedIds] = React.useState<Set<string>>(new Set())
  const [votingId, setVotingId] = React.useState<string | null>(null)
  const [showSubmit, setShowSubmit] = React.useState(false)
  const [justSubmitted, setJustSubmitted] = React.useState(false)

  // Load voted state from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(`votes:${board.slug}`)
      if (stored) setVotedIds(new Set(JSON.parse(stored)))
    } catch { /* ignore */ }
  }, [board.slug])

  const saveVotes = (ids: Set<string>) => {
    try {
      localStorage.setItem(`votes:${board.slug}`, JSON.stringify([...ids]))
    } catch { /* ignore */ }
  }

  const handleVote = async (feedbackId: string) => {
    if (votingId) return
    setVotingId(feedbackId)

    try {
      const res = await fetch(`/api/boards/${board.slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId }),
      })

      if (!res.ok) return
      const data = await res.json()

      setFeedback((prev) =>
        prev.map((f) =>
          f.id === feedbackId
            ? { ...f, vote_count: f.vote_count + (data.voted ? 1 : -1) }
            : f
        )
      )

      const newVoted = new Set(votedIds)
      if (data.voted) {
        newVoted.add(feedbackId)
      } else {
        newVoted.delete(feedbackId)
      }
      setVotedIds(newVoted)
      saveVotes(newVoted)
    } finally {
      setVotingId(null)
    }
  }

  const handleSubmitted = () => {
    setShowSubmit(false)
    setJustSubmitted(true)
    setTimeout(() => setJustSubmitted(false), 4000)
    // Refresh feedback
    fetch(`/api/boards/${board.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setFeedback(data.feedback)
      })
      .catch(() => {})
  }

  // Filter & sort
  const filtered = React.useMemo(() => {
    let items = feedback
    if (filter !== 'all') {
      items = items.filter((f) => f.type === filter)
    }
    return [...items].sort((a, b) => {
      if (sort === 'votes') return b.vote_count - a.vote_count
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      // status sort: in_progress > planned > reviewed > new > closed
      const statusOrder: Record<string, number> = { in_progress: 0, planned: 1, reviewed: 2, new: 3, closed: 4 }
      return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
    })
  }, [feedback, filter, sort])

  const accentColor = board.branding?.accent_color || '#6366f1'

  const filterTabs: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...board.show_types.map((t) => ({
      value: t as FilterType,
      label: typeConfig[t]?.label || t,
    })),
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          {board.title || 'Feature Board'}
        </h1>
        {board.description && (
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            {board.description}
          </p>
        )}
      </div>

      {/* Success toast */}
      {justSubmitted && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 animate-in slide-in-from-top-2 duration-300">
          ✅ Your feedback was submitted successfully! It will appear once reviewed.
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                filter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="votes">Most Voted</option>
            <option value="newest">Newest</option>
            <option value="status">Status</option>
          </select>

          {/* Submit button */}
          {board.allow_submissions && (
            <button
              onClick={() => setShowSubmit(true)}
              style={{ backgroundColor: accentColor }}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.97]"
            >
              + Submit Feedback
            </button>
          )}
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-gray-400 dark:text-gray-500 text-lg">No feedback yet</p>
            {board.allow_submissions && (
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Be the first to share your thoughts!
              </p>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              voted={votedIds.has(item.id)}
              onVote={handleVote}
              votingId={votingId}
            />
          ))
        )}
      </div>

      {/* Item count */}
      {filtered.length > 0 && (
        <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </p>
      )}

      {/* Submit modal */}
      {showSubmit && (
        <SubmitModal
          slug={board.slug}
          showTypes={board.show_types}
          onClose={() => setShowSubmit(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}
