'use client'

import * as React from 'react'
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
        'flex min-w-[64px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm transition',
        voted
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary',
        loading && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-lg leading-none">&uarr;</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </button>
  )
}

interface BoardFeedbackCardProps {
  item: FeedbackItem
  comments: AdminComment[]
  isExpanded: boolean
  voted: boolean
  voting: boolean
  canModerate: boolean
  replyDraft: string
  busy: boolean
  onVote: () => void
  onToggle: () => void
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
  voting,
  canModerate,
  replyDraft,
  busy,
  onVote,
  onToggle,
  onOpenReport,
  onReplyDraftChange,
  onReplySubmit,
  onStatusChange,
  onHide,
}: BoardFeedbackCardProps) {
  const type = item.type ? typeConfig[item.type] : null
  const status = statusConfig[item.status] || statusConfig.new
  const details = getFullDescription(item.message)

  return (
    <article
      id={`feedback-${item.id}`}
      className={cn(
        'rounded-3xl border bg-card p-5 shadow-sm transition',
        isExpanded && 'border-primary/20 shadow-md',
      )}
    >
      <div className="flex gap-4">
        <UpvoteButton count={item.vote_count} voted={voted} onClick={onVote} loading={voting} />
        <div className="min-w-0 flex-1">
          <button onClick={onToggle} className="text-left">
            <h3 className="text-lg font-semibold leading-snug text-foreground">
              {getTitle(item.message)}
            </h3>
          </button>
          {!isExpanded && getDescription(item.message) && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {getDescription(item.message)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {type && (
              <span
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                  type.tone,
                )}
              >
                {type.label}
              </span>
            )}
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                status.tone,
              )}
            >
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</span>
            <button
              onClick={onToggle}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? 'Collapse' : 'Details'}
            </button>
            <button
              onClick={onOpenReport}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Report post
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {details && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {details}
                </p>
              )}

              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl border border-border bg-muted/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Team reply
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {relativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canModerate && (
                <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label="Update status"
                      value={item.status}
                      onChange={(event) => onStatusChange(event.target.value)}
                      className="h-9 rounded-md border border-border bg-card px-3 text-sm"
                    >
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={onHide}
                      className="text-sm font-medium text-destructive hover:text-destructive/80"
                    >
                      Hide from board
                    </button>
                  </div>

                  <textarea
                    value={replyDraft}
                    onChange={(event) => onReplyDraftChange(event.target.value)}
                    aria-label="Public reply"
                    rows={3}
                    className="min-h-[96px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                    placeholder="Share a public update or clarify the plan."
                  />
                  <button
                    onClick={onReplySubmit}
                    disabled={busy || replyDraft.trim().length === 0}
                    className={cn(
                      'rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90',
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
