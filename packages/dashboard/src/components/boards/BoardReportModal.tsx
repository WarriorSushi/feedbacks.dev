'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-report-modal-title"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Moderation
            </p>
            <h2
              id="board-report-modal-title"
              className="mt-2 text-xl font-semibold text-foreground"
            >
              {target.type === 'board' ? 'Report board' : 'Report post'}
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground/68">
              Reports stay inside the team workflow so the board owner can review them with context.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="p-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Thanks. The report has been recorded for review.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-label="Report reason"
              placeholder="What needs review?"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              maxLength={160}
              required
            />
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              aria-label="Report details"
              rows={4}
              className="min-h-[128px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              placeholder="Optional details that help the team review this faster."
              maxLength={2000}
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email (optional)"
              placeholder="Email (optional)"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={submitting || reason.trim().length === 0}
                className="px-4 font-semibold"
              >
                {submitting ? 'Saving...' : 'Submit report'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
