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

interface AdminComment {
  id: string
  feedback_id: string
  content: string
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

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  new: { label: 'New', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', dotColor: 'bg-gray-400' },
  reviewed: { label: 'Under Review', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', dotColor: 'bg-yellow-500' },
  planned: { label: 'Planned', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300', dotColor: 'bg-purple-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300', dotColor: 'bg-orange-500' },
  closed: { label: 'Done', color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300', dotColor: 'bg-green-500' },
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

function getFullDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  return lines.slice(1).join('\n').trim()
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
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
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

function AdminCommentBubble({ comment }: { comment: AdminComment }) {
  return (
    <div className="flex gap-3 mt-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-primary/20">
        D
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Dev
          </span>
          <span className="text-[11px] text-muted-foreground">{relativeTime(comment.created_at)}</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  )
}

function FeedbackCard({
  item,
  voted,
  onVote,
  votingId,
  comments,
  isExpanded,
  onToggle,
}: {
  item: FeedbackItem
  voted: boolean
  onVote: (id: string) => void
  votingId: string | null
  comments: AdminComment[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const type = item.type ? typeConfig[item.type] : null
  const status = statusConfig[item.status] || statusConfig.new
  const hasDetails = getFullDescription(item.message) || comments.length > 0

  return (
    <div
      className={cn(
        'group rounded-2xl border bg-card transition-all duration-200',
        isExpanded ? 'shadow-lg border-primary/20' : 'hover:shadow-md hover:border-border/80'
      )}
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <UpvoteButton
          count={item.vote_count}
          voted={voted}
          onClick={() => onVote(item.id)}
          loading={votingId === item.id}
        />

        <div className="flex-1 min-w-0">
          <button
            onClick={hasDetails ? onToggle : undefined}
            className={cn(
              'text-left w-full',
              hasDetails && 'cursor-pointer'
            )}
          >
            <h3 className="font-semibold text-foreground leading-snug">
              {getTitle(item.message)}
              {comments.length > 0 && !isExpanded && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary align-middle">
                  Dev replied
                </span>
              )}
            </h3>
            {!isExpanded && getDescription(item.message) && (
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {getDescription(item.message)}
              </p>
            )}
          </button>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {type && (
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', type.color)}>
                <span>{type.icon}</span> {type.label}
              </span>
            )}
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', status.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {relativeTime(item.created_at)}
            </span>
            {hasDetails && (
              <button
                onClick={onToggle}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? 'Collapse' : 'Details'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t px-4 sm:px-5 pb-4 sm:pb-5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {getFullDescription(item.message) && (
            <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap">
              {getFullDescription(item.message)}
            </p>
          )}
          {comments.length > 0 && (
            <div className={cn(getFullDescription(item.message) && 'mt-4 pt-3 border-t border-dashed')}>
              {comments.map((c) => (
                <AdminCommentBubble key={c.id} comment={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UpdatesSection({ feedback }: { feedback: FeedbackItem[] }) {
  const inProgress = feedback.filter((f) => f.status === 'in_progress')
  const recentlyShipped = feedback.filter((f) => f.status === 'closed').slice(0, 3)

  if (inProgress.length === 0 && recentlyShipped.length === 0) return null

  return (
    <div className="mb-8 space-y-4">
      {inProgress.length > 0 && (
        <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/40 p-5 dark:border-orange-800/40 dark:from-orange-950/30 dark:to-amber-950/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              Building now
            </h3>
          </div>
          <div className="space-y-2">
            {inProgress.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <span className="text-orange-500">{f.type ? typeConfig[f.type]?.icon : '📌'}</span>
                <span className="text-foreground/80">{getTitle(f.message)}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{f.vote_count} votes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentlyShipped.length > 0 && (
        <div className="rounded-2xl border border-green-200/60 bg-gradient-to-r from-green-50/80 to-emerald-50/40 p-5 dark:border-green-800/40 dark:from-green-950/30 dark:to-emerald-950/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 dark:text-green-400">✅</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
              Recently shipped
            </h3>
          </div>
          <div className="space-y-2">
            {recentlyShipped.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <span className="text-green-500">{f.type ? typeConfig[f.type]?.icon : '📌'}</span>
                <span className="text-foreground/80 line-through decoration-green-400/40">{getTitle(f.message)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocus = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement
    const modal = modalRef.current
    if (!modal) return

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length > 0) focusable[0].focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [onClose])

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
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-modal-title"
        className="relative w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <h2 id="submit-modal-title" className="text-xl font-bold text-foreground">Submit Feedback</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your ideas or report bugs. The community will vote!
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
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
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Your feedback
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="First line becomes the title. Add details below..."
              rows={4}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
              required
              minLength={5}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className={cn(
                'flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]',
                (submitting || message.trim().length < 5) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
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
  initialComments = [],
}: {
  board: BoardInfo
  initialFeedback: FeedbackItem[]
  initialComments?: AdminComment[]
}) {
  const [feedback, setFeedback] = React.useState(initialFeedback)
  const [comments, setComments] = React.useState(initialComments)
  const [filter, setFilter] = React.useState<FilterType>('all')
  const [sort, setSort] = React.useState<SortMode>('votes')
  const [search, setSearch] = React.useState('')
  const [votedIds, setVotedIds] = React.useState<Set<string>>(new Set())
  const [votingId, setVotingId] = React.useState<string | null>(null)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [showSubmit, setShowSubmit] = React.useState(false)
  const [justSubmitted, setJustSubmitted] = React.useState(false)

  // Group comments by feedback_id
  const commentsByFeedback = React.useMemo(() => {
    const map: Record<string, AdminComment[]> = {}
    comments.forEach((c) => {
      if (!map[c.feedback_id]) map[c.feedback_id] = []
      map[c.feedback_id].push(c)
    })
    return map
  }, [comments])

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
    fetch(`/api/boards/${board.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setFeedback(data.feedback)
        if (data.comments) setComments(data.comments)
      })
      .catch(() => {})
  }

  // Filter, search & sort
  const filtered = React.useMemo(() => {
    let items = feedback
    if (filter !== 'all') {
      items = items.filter((f) => f.type === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((f) => f.message.toLowerCase().includes(q))
    }
    return [...items].sort((a, b) => {
      if (sort === 'votes') return b.vote_count - a.vote_count
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      const statusOrder: Record<string, number> = { in_progress: 0, planned: 1, reviewed: 2, new: 3, closed: 4 }
      return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
    })
  }, [feedback, filter, sort, search])

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
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {board.title || 'Feature Board'}
        </h1>
        {board.description && (
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {board.description}
          </p>
        )}
      </div>

      {/* Updates from the team */}
      <UpdatesSection feedback={feedback} />

      {/* Success toast */}
      {justSubmitted && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300 animate-in slide-in-from-top-2 duration-300">
          Your feedback was submitted successfully! It will appear once reviewed.
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  filter === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
              aria-label="Sort feedback"
              className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="w-full rounded-xl border bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
            {search.trim() ? (
              <>
                <p className="text-muted-foreground text-lg">No results for &ldquo;{search}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or{' '}
                  <button onClick={() => setSearch('')} className="text-primary hover:underline">
                    clear the search
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-lg">No feedback yet</p>
                {board.allow_submissions && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first to share your thoughts!
                  </p>
                )}
              </>
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
              comments={commentsByFeedback[item.id] || []}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))
        )}
      </div>

      {/* Item count */}
      {filtered.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </p>
      )}

      {/* Powered by */}
      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Powered by feedbacks<span className="text-primary/50">.dev</span>
        </a>
      </div>

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
