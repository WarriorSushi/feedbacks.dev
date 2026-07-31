'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportTarget } from './board-types'
import { FieldError, FormErrorSummary } from '@/components/ui/field-error'
import { readErrorMessage, readFieldErrors, type FieldErrors } from '@/lib/form-errors'

interface BoardReportModalProps {
  slug: string
  target: ReportTarget
  onClose: () => void
}

export function BoardReportModal({ slug, target, onClose }: BoardReportModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const [reason, setReason] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    dialog.querySelector<HTMLElement>('input, textarea, button')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled])')).filter((element) => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previous?.focus() }
  }, [onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

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
      if (!response.ok) {
        setFieldErrors(readFieldErrors(data))
        throw new Error(readErrorMessage(data, 'The report could not be saved. Check your connection and try again.'))
      }
      setSuccess(true)
      window.setTimeout(onClose, 1000)
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'The report could not be saved. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
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
          <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-4 p-5">
            <div className="space-y-2">
              <label htmlFor="board-report-reason" className="text-sm font-medium text-foreground">Reason</label>
              <input
              id="board-report-reason"
              value={reason}
              onChange={(event) => { setReason(event.target.value); setFieldErrors((current) => ({ ...current, reason: '' })) }}
              aria-invalid={Boolean(fieldErrors.reason)}
              aria-describedby={fieldErrors.reason ? 'board-report-reason-error' : undefined}
              placeholder="What needs review?"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive/35"
              maxLength={160}
              required
            />
              <FieldError id="board-report-reason-error">{fieldErrors.reason}</FieldError>
            </div>
            <div className="space-y-2">
              <label htmlFor="board-report-details" className="text-sm font-medium text-foreground">Details <span className="font-normal text-muted-foreground">Optional</span></label>
              <textarea
              id="board-report-details"
              value={details}
              onChange={(event) => { setDetails(event.target.value); setFieldErrors((current) => ({ ...current, details: '' })) }}
              aria-invalid={Boolean(fieldErrors.details)}
              aria-describedby={fieldErrors.details ? 'board-report-details-error' : undefined}
              rows={4}
              className="min-h-[128px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive/35"
              placeholder="Optional details that help the team review this faster."
              maxLength={2000}
            />
              <FieldError id="board-report-details-error">{fieldErrors.details}</FieldError>
            </div>
            <div className="space-y-2">
              <label htmlFor="board-report-email" className="text-sm font-medium text-foreground">Email <span className="font-normal text-muted-foreground">Optional</span></label>
              <input
              id="board-report-email"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })) }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'board-report-email-error' : undefined}
              placeholder="Email (optional)"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive/35"
            />
              <FieldError id="board-report-email-error">{fieldErrors.email}</FieldError>
            </div>
            <FormErrorSummary>{error}</FormErrorSummary>
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
