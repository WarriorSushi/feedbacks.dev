'use client'

import { MessageSquareQuote, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  typeConfig,
  statusConfig,
  getTitle,
  getDescription,
  getFullDescription,
  relativeTime,
  type FeedbackItem,
  type AdminComment,
} from './board-types'

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
        'flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border/80 bg-background px-2 py-3 text-sm shadow-sm transition-colors sm:w-[58px]',
        voted
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'text-foreground/72 hover:border-primary/25 hover:text-foreground',
        loading && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Votes
      </span>
      <span className="mt-2 text-xl leading-none">&uarr;</span>
      <span className="mt-1 text-base font-semibold tabular-nums text-foreground">{count}</span>
    </button>
  )
}

interface BoardFeedbackCardProps {
  item: FeedbackItem
  comments: AdminComment[]
  isExpanded: boolean
  voted: boolean
  watched: boolean
  voting: boolean
  canModerate: boolean
  canWatchUpdates: boolean
  replyDraft: string
  busy: boolean
  onVote: () => void
  onToggle: () => void
  onToggleWatch: () => void
  onOpenReport: () => void
  onReplyDraftChange: (value: string) => void
  onReplySubmit: () => void
  onStatusChange: (status: string) => void
  onHide: () => void
}

export function BoardFeedbackCard({
  item,
  comments,
  isExpanded,
  voted,
  watched,
  voting,
  canModerate,
  canWatchUpdates,
  replyDraft,
  busy,
  onVote,
  onToggle,
  onToggleWatch,
  onOpenReport,
  onReplyDraftChange,
  onReplySubmit,
  onStatusChange,
  onHide,
}: BoardFeedbackCardProps) {
  const type = item.type ? typeConfig[item.type] : null
  const status = statusConfig[item.status] || statusConfig.new
  const details = getFullDescription(item.message)
  const replyCount = comments.length

  return (
    <article
      id={`feedback-${item.id}`}
      className={cn(
        'border-b border-border/70 py-5 transition-colors last:border-b-0',
        isExpanded ? 'bg-card/40' : 'hover:bg-card/35',
      )}
    >
      <div className="flex items-start gap-4 px-0 sm:px-0">
        <UpvoteButton count={item.vote_count} voted={voted} onClick={onVote} loading={voting} />

        <div className="min-w-0 flex-1">
          <button onClick={onToggle} className="w-full text-left">
            <h3 className="text-lg font-semibold leading-snug text-foreground">{getTitle(item.message)}</h3>
            {!isExpanded && getDescription(item.message) && (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground/68">
                {getDescription(item.message)}
              </p>
            )}
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {type && (
              <span
                className={cn(
                  'inline-flex rounded-md border px-2.5 py-1 text-xs font-medium',
                  type.tone,
                )}
              >
                {type.label}
              </span>
            )}
            <span
              className={cn(
                'inline-flex rounded-md border px-2.5 py-1 text-xs font-medium',
                status.tone,
              )}
            >
              {status.label}
            </span>
            {replyCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                {replyCount} {replyCount === 1 ? 'team reply' : 'team replies'}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <button
              onClick={onToggle}
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {isExpanded ? 'Collapse thread' : 'Details'}
            </button>
            <button
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldAlert className="h-4 w-4" />
              Report post
            </button>
            {canWatchUpdates && (
              <button
                onClick={onToggleWatch}
                className={cn(
                  'font-medium transition-colors',
                  watched ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {watched ? 'Watching' : 'Watch updates'}
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
              {details && (
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">
                  {details}
                </p>
              )}

              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-border/70 bg-background px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Team reply
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {relativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/80">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canModerate && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-background px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label="Update status"
                      value={item.status}
                      onChange={(event) => onStatusChange(event.target.value)}
                      className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                    >
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={onHide}
                      className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                    >
                      Hide from board
                    </button>
                  </div>

                  <textarea
                    value={replyDraft}
                    onChange={(event) => onReplyDraftChange(event.target.value)}
                    aria-label="Public reply"
                    rows={3}
                    className="min-h-[112px] w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    placeholder="Share a public update or clarify the plan."
                  />
                  <button
                    onClick={onReplySubmit}
                    disabled={busy || replyDraft.trim().length === 0}
                    className={cn(
                      'rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90',
                      (busy || replyDraft.trim().length === 0) && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {busy ? 'Saving...' : 'Post public reply'}
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
