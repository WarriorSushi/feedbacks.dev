'use client'

import * as React from 'react'
import Link from 'next/link'
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'
import { cn } from '@/lib/utils'

interface BoardInfo {
  projectId: string
  title: string | null
  description: string | null
  slug: string
  allow_submissions: boolean
  show_types: string[]
  branding: BoardBranding
  customCss?: string | null
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

interface BoardRecommendation {
  slug: string
  title: string
  description: string
  branding: BoardBranding
  feedbackCount: number
  trustScore: number
}

interface BoardSuggestion {
  id: string
  title: string
  description: string
  status: string
  vote_count: number
}

interface ReportTarget {
  type: 'board' | 'feedback'
  feedbackId?: string
}

type SortMode = 'votes' | 'newest' | 'status' | 'watched'
type FilterType = 'all' | 'idea' | 'bug' | 'praise' | 'question'

const typeConfig: Record<string, { label: string; tone: string }> = {
  idea: { label: 'Feature request', tone: 'border-sky-200 bg-sky-50 text-sky-700' },
  bug: { label: 'Bug', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  praise: { label: 'Praise', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  question: { label: 'Question', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
}

const statusConfig: Record<string, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'bg-slate-100 text-slate-700' },
  reviewed: { label: 'Under review', tone: 'bg-amber-100 text-amber-800' },
  planned: { label: 'Planned', tone: 'bg-violet-100 text-violet-700' },
  in_progress: { label: 'In progress', tone: 'bg-orange-100 text-orange-800' },
  closed: { label: 'Shipped', tone: 'bg-emerald-100 text-emerald-700' },
}

function getTitle(message: string): string {
  const firstLine = message.split('\n')[0]
  return firstLine.length > 88 ? `${firstLine.slice(0, 88)}…` : firstLine
}

function getDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  const rest = lines.slice(1).join(' ').trim()
  return rest.length > 180 ? `${rest.slice(0, 180)}…` : rest
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function readSetStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

function writeSetStorage(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]))
  } catch {
    // ignore
  }
}

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
        'flex min-w-[64px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm transition',
        voted ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary',
        loading && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-lg leading-none">↑</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </button>
  )
}

function ReportModal({
  slug,
  target,
  onClose,
}: {
  slug: string
  target: ReportTarget
  onClose: () => void
}) {
  const [reason, setReason] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/boards/${slug}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details,
          email,
          ...(target.feedbackId ? { feedback_id: target.feedbackId } : {}),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to save report')
      setSuccess(true)
      window.setTimeout(onClose, 1000)
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-report-modal-title"
        className="relative w-full max-w-xl rounded-3xl border bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="board-report-modal-title" className="text-xl font-semibold text-slate-900">
              {target.type === 'board' ? 'Report board' : 'Report post'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Reports stay inside the team workflow so they can be reviewed with full context.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">Close</button>
        </div>
        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Thanks. The report has been recorded for review.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-label="Report reason"
              placeholder="What needs review?"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              maxLength={160}
              required
            />
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              aria-label="Report details"
              rows={4}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white"
              placeholder="Optional details that help the team review this faster."
              maxLength={2000}
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email (optional)"
              placeholder="Email (optional)"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || reason.trim().length === 0}
                className={cn(
                  'rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90',
                  (submitting || reason.trim().length === 0) && 'cursor-not-allowed opacity-60',
                )}
              >
                {submitting ? 'Saving…' : 'Submit report'}
              </button>
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}
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
  const [hp, setHp] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<BoardSuggestion[]>([])
  const deferredMessage = React.useDeferredValue(message)

  React.useEffect(() => {
    const query = deferredMessage.trim()
    if (query.length < 5) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/boards/${slug}/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!response.ok) return
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch {
        // ignore
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [deferredMessage, slug])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch(`/api/boards/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type, email: email || undefined, hp }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions)
        throw new Error(data.error || 'Failed to submit')
      }
      onSubmitted()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-submit-modal-title"
        className="relative w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="board-submit-modal-title" className="text-xl font-semibold text-slate-900">Submit feedback</h2>
            <p className="mt-1 text-sm text-slate-600">Use the first line as a clear request title, then add context below it.</p>
          </div>
          <button onClick={onClose} className="rounded-full border px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {showTypes.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setType(entry)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition',
                  type === entry ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                {typeConfig[entry]?.label || entry}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Your feedback"
            rows={5}
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white"
            placeholder="Faster screenshot capture in onboarding&#10;The first screenshot step feels slower than the rest of the flow..."
            required
            minLength={5}
            maxLength={2000}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email (optional)"
              placeholder="Email (optional)"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
            <input
              value={hp}
              onChange={(event) => setHp(event.target.value)}
              aria-label="Leave this empty"
              tabIndex={-1}
              autoComplete="off"
              placeholder="Leave this empty"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-900">Possibly related requests</p>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <Link key={suggestion.id} href={`#feedback-${suggestion.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-primary/30">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
                      <span className="text-xs text-slate-500">{suggestion.vote_count} votes</span>
                    </div>
                    {suggestion.description && <p className="mt-1 text-sm text-slate-600">{suggestion.description}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className={cn(
                'rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90',
                (submitting || message.trim().length < 5) && 'cursor-not-allowed opacity-60',
              )}
            >
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FeedbackCard({
  item,
  comments,
  isExpanded,
  voted,
  watched,
  voting,
  canModerate,
  replyDraft,
  busy,
  onVote,
  onToggle,
  onWatch,
  onOpenReport,
  onReplyDraftChange,
  onReplySubmit,
  onStatusChange,
  onHide,
}: {
  item: FeedbackItem
  comments: AdminComment[]
  isExpanded: boolean
  voted: boolean
  watched: boolean
  voting: boolean
  canModerate: boolean
  replyDraft: string
  busy: boolean
  onVote: () => void
  onToggle: () => void
  onWatch: () => void
  onOpenReport: () => void
  onReplyDraftChange: (value: string) => void
  onReplySubmit: () => void
  onStatusChange: (status: string) => void
  onHide: () => void
}) {
  const type = item.type ? typeConfig[item.type] : null
  const status = statusConfig[item.status] || statusConfig.new
  const details = getFullDescription(item.message)

  return (
    <article id={`feedback-${item.id}`} className={cn('rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur transition', isExpanded && 'border-primary/20 shadow-md')}>
      <div className="flex gap-4">
        <UpvoteButton count={item.vote_count} voted={voted} onClick={onVote} loading={voting} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <button onClick={onToggle} className="text-left">
                <h3 className="text-lg font-semibold leading-snug text-slate-900">{getTitle(item.message)}</h3>
              </button>
              {!isExpanded && getDescription(item.message) && <p className="mt-1 text-sm leading-relaxed text-slate-600">{getDescription(item.message)}</p>}
            </div>

            <button
              onClick={onWatch}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                watched ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
            >
              {watched ? 'Watching' : 'Watch'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {type && <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', type.tone)}>{type.label}</span>}
            <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', status.tone)}>{status.label}</span>
            <span className="text-xs text-slate-500">{relativeTime(item.created_at)}</span>
            <button onClick={onToggle} className="text-xs font-medium text-slate-500 hover:text-slate-900">{isExpanded ? 'Collapse' : 'Details'}</button>
            <button onClick={onOpenReport} className="text-xs font-medium text-slate-500 hover:text-slate-900">Report post</button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {details && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{details}</p>}

              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Team reply</p>
                        <span className="text-xs text-slate-500">{relativeTime(comment.created_at)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {canModerate && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label="Update status"
                      value={item.status}
                      onChange={(event) => onStatusChange(event.target.value)}
                      className="h-9 rounded-md border bg-white px-3 text-sm"
                    >
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                    <button onClick={onHide} className="text-sm font-medium text-rose-600 hover:text-rose-700">Hide from board</button>
                  </div>

                  <textarea
                    value={replyDraft}
                    onChange={(event) => onReplyDraftChange(event.target.value)}
                    aria-label="Public reply"
                    rows={3}
                    className="min-h-[96px] w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    placeholder="Share a public update or clarify the plan."
                  />
                  <button
                    onClick={onReplySubmit}
                    disabled={busy || replyDraft.trim().length === 0}
                    className={cn(
                      'rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90',
                      (busy || replyDraft.trim().length === 0) && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {busy ? 'Saving…' : 'Post public reply'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

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
  const accentColor = board.branding.accentColor || '#0f766e'

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

  const activityItems = React.useMemo(() => {
    const announcements = initialAnnouncements.map((entry) => ({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      date: entry.publishedAt,
      href: entry.href,
    }))
    const replies = comments.slice(-4).map((comment) => ({
      id: comment.id,
      title: 'Team replied publicly',
      body: comment.content,
      date: comment.created_at,
      href: undefined,
    }))
    const shipped = feedback
      .filter((entry) => entry.status === 'closed' || entry.status === 'in_progress')
      .slice(0, 4)
      .map((entry) => ({
        id: `status-${entry.id}`,
        title: `${statusConfig[entry.status]?.label || 'Update'}: ${getTitle(entry.message)}`,
        body: entry.status === 'closed' ? 'This item has shipped.' : 'The team is building this now.',
        date: entry.created_at,
        href: undefined,
      }))

    return [...announcements, ...replies, ...shipped]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [comments, feedback, initialAnnouncements])

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
      setFeedback((prev) => prev.map((entry) => entry.id === feedbackId ? { ...entry, vote_count: entry.vote_count + (data.voted ? 1 : -1) } : entry))
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
      setComments((prev) => [...prev, { id: data.comment.id, feedback_id: feedbackId, content: data.comment.content, created_at: data.comment.created_at }])
      setReplyDrafts((prev) => ({ ...prev, [feedbackId]: '' }))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to post public reply')
    } finally {
      setBusyId(null)
    }
  }

  const handleModeration = async (feedbackId: string, action: 'status' | 'hide', value?: string) => {
    setBusyId(feedbackId)
    try {
      const response = await fetch(`/api/boards/${board.slug}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, action, value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update board item')
      if (action === 'hide') setFeedback((prev) => prev.filter((entry) => entry.id !== feedbackId))
      else if (action === 'status' && value) setFeedback((prev) => prev.map((entry) => entry.id === feedbackId ? { ...entry, status: value } : entry))
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
    else if (sort === 'newest') next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sort === 'watched') next.sort((a, b) => Number(watchedIds.has(b.id)) - Number(watchedIds.has(a.id)) || b.vote_count - a.vote_count)
    else {
      const order: Record<string, number> = { in_progress: 0, planned: 1, reviewed: 2, new: 3, closed: 4 }
      next.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))
    }
    return next
  }, [feedback, filter, search, sort, watchedIds])

  const filterTabs: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...board.show_types.map((type) => ({ value: type as FilterType, label: typeConfig[type]?.label || type })),
  ]

  const heroTitle = board.branding.heroTitle || board.title || 'Public feedback board'
  const heroDescription = board.branding.heroDescription || board.description || 'Share feedback, see what the team is shipping, and follow the public side of their feedback workflow.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_42%,_#f8fafc_100%)]">
      {board.customCss ? <style>{board.customCss}</style> : null}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-[32px] border bg-white/92 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ backgroundColor: accentColor }}>
                  {board.branding.logoEmoji || (board.title || 'F').slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{board.branding.heroEyebrow || 'Public board'}</p>
                  {board.branding.tagline && <p className="mt-1 text-sm text-slate-600">{board.branding.tagline}</p>}
                </div>
              </div>
              <div className="mt-6 max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{heroTitle}</h1>
                <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">{heroDescription}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {board.allow_submissions && <button onClick={() => setShowSubmit(true)} className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: accentColor }}>Submit feedback</button>}
                {board.branding.websiteUrl && <a href={board.branding.websiteUrl} target="_blank" rel="noreferrer" className="rounded-2xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Visit product site</a>}
                <button onClick={() => void toggleFollowed()} className={cn('rounded-2xl border px-4 py-2.5 text-sm font-medium transition', followed ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}>
                  {followed ? 'Following' : viewerSignedIn ? 'Follow board' : 'Sign in to follow'}
                </button>
                <Link href="/boards" className="rounded-2xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Browse boards</Link>
                <button onClick={() => setReportTarget({ type: 'board' })} className="rounded-2xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Report board</button>
              </div>
            </section>

            {activityItems.length > 0 && (
              <section className="rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Activity</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Product updates</h2>
                <div className="mt-4 space-y-3">
                  {activityItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                      {item.href && <a href={item.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">Read more</a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {justSubmitted && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Your feedback was submitted. It now enters the same public flow as the rest of the board.</div>}

            <section className="rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filterTabs.map((tab) => (
                    <button key={tab.value} onClick={() => setFilter(tab.value)} className={cn('rounded-full px-3.5 py-1.5 text-sm transition', filter === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{tab.label}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-10 rounded-xl border bg-white px-3 text-sm text-slate-700">
                    <option value="votes">Most voted</option>
                    <option value="newest">Newest</option>
                    <option value="status">By status</option>
                    <option value="watched">Watched first</option>
                  </select>
                  <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." className="h-10 min-w-[240px] rounded-xl border bg-white px-3 text-sm text-slate-700" />
                </div>
              </div>
            </section>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-white/88 p-10 text-center shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">{board.branding.emptyStateTitle || 'No public requests yet'}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{search.trim() ? `No results for “${search}”. Try another search or clear the filters.` : board.branding.emptyStateDescription || 'Be the first person to submit something the team can respond to publicly.'}</p>
                </div>
              ) : (
                filtered.map((item) => (
                  <FeedbackCard
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
                    onWatch={() => void toggleWatched(item.id)}
                    onOpenReport={() => setReportTarget({ type: 'feedback', feedbackId: item.id })}
                    onReplyDraftChange={(value) => setReplyDrafts((prev) => ({ ...prev, [item.id]: value }))}
                    onReplySubmit={() => void handleReplySubmit(item.id)}
                    onStatusChange={(status) => void handleModeration(item.id, 'status', status)}
                    onHide={() => void handleModeration(item.id, 'hide')}
                  />
                ))
              )}
            </div>

            {recommendations.length > 0 && (
              <section className="rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Explore more</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Related product boards</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {recommendations.map((entry) => (
                    <Link key={entry.slug} href={`/p/${entry.slug}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary/30 hover:bg-white">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: entry.branding.accentColor || '#0f766e' }}>
                          {entry.branding.logoEmoji || entry.title.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{entry.title}</p>
                          <p className="truncate text-xs text-slate-500">{entry.feedbackCount} requests · trust {entry.trustScore}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{entry.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="text-center"><Link href="/" className="text-xs text-slate-400 transition hover:text-slate-600">Powered by feedbacks.dev</Link></div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust signals</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><p className="text-xs text-slate-500">Public requests</p><p className="mt-1 text-2xl font-semibold text-slate-900">{feedback.length}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><p className="text-xs text-slate-500">Team replies</p><p className="mt-1 text-2xl font-semibold text-slate-900">{comments.length}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><p className="text-xs text-slate-500">In progress or shipped</p><p className="mt-1 text-2xl font-semibold text-slate-900">{feedback.filter((item) => item.status === 'in_progress' || item.status === 'closed').length}</p></div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Moderation and trust</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                <li>This board is the public side of the team’s feedback workflow.</li>
                <li>Votes are rate-limited, and submissions use related-request suggestions plus spam heuristics.</li>
                <li>Reports stay in-product so the team can review trust issues without losing context.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showSubmit && <SubmitModal slug={board.slug} showTypes={board.show_types} onClose={() => setShowSubmit(false)} onSubmitted={() => void handleSubmitted()} />}
      {reportTarget && <ReportModal slug={board.slug} target={reportTarget} onClose={() => setReportTarget(null)} />}
    </div>
  )
}
