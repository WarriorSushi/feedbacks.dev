'use client'

import * as React from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { typeConfig, type BoardSuggestion } from './board-types'

interface BoardSubmitFormProps {
  slug: string
  showTypes: string[]
  onClose: () => void
  onSubmitted: () => void
}

export function BoardSubmitForm({ slug, showTypes, onClose, onSubmitted }: BoardSubmitFormProps) {
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
        const response = await fetch(
          `/api/boards/${slug}/suggestions?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
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
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-submit-modal-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              New feedback
            </p>
            <h2
              id="board-submit-modal-title"
              className="mt-2 text-xl font-semibold text-foreground"
            >
              Post a request or bug report
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground/68">
              Use the first line as a clear title, then add the context the team needs below it.
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

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Request type
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {showTypes.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setType(entry)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    type === entry
                      ? 'border-foreground bg-foreground text-background shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {typeConfig[entry]?.label || entry}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Your feedback"
            rows={6}
            className="min-h-[160px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            placeholder={'Faster screenshot capture in onboarding\nThe first screenshot step feels slower than the rest of the flow...'}
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
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
            <input
              value={hp}
              onChange={(event) => setHp(event.target.value)}
              aria-label="Leave this empty"
              tabIndex={-1}
              autoComplete="off"
              placeholder="Leave this empty"
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-background px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Possibly related requests</p>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`#feedback-${suggestion.id}`}
                    className="block rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.vote_count} votes
                      </span>
                    </div>
                    {suggestion.description && (
                      <p className="mt-2 text-sm leading-6 text-foreground/68">
                        {suggestion.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className="px-4 font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
