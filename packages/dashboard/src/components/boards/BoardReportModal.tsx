'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ReportTarget } from './board-types'

interface BoardReportModalProps {
  slug: string
  target: ReportTarget
  onClose: () => void
}

export function BoardReportModal({ slug, target, onClose }: BoardReportModalProps) {
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
        className="relative w-full max-w-xl rounded-3xl border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="board-report-modal-title"
              className="text-xl font-semibold text-foreground"
            >
              {target.type === 'board' ? 'Report board' : 'Report post'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports stay inside the team workflow so they can be reviewed with full context.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
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
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              maxLength={160}
              required
            />
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              aria-label="Report details"
              rows={4}
              className="min-h-[120px] w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
              placeholder="Optional details that help the team review this faster."
              maxLength={2000}
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email (optional)"
              placeholder="Email (optional)"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || reason.trim().length === 0}
                className={cn(
                  'rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90',
                  (submitting || reason.trim().length === 0) && 'cursor-not-allowed opacity-60',
                )}
              >
                {submitting ? 'Saving...' : 'Submit report'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
