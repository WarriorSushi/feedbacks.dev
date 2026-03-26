'use client'

import * as React from 'react'
import Link from 'next/link'
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
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-submit-modal-title"
        className="relative w-full max-w-2xl rounded-3xl border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="board-submit-modal-title"
              className="text-xl font-semibold text-foreground"
            >
              Submit feedback
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the first line as a clear request title, then add context below it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
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
                  type === entry
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-border/80',
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
            className="min-h-[140px] w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
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
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
            <input
              value={hp}
              onChange={(event) => setHp(event.target.value)}
              aria-label="Leave this empty"
              tabIndex={-1}
              autoComplete="off"
              placeholder="Leave this empty"
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">Possibly related requests</p>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`#feedback-${suggestion.id}`}
                    className="block rounded-xl border border-border bg-card p-3 hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.vote_count} votes
                      </span>
                    </div>
                    {suggestion.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className={cn(
                'rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90',
                (submitting || message.trim().length < 5) && 'cursor-not-allowed opacity-60',
              )}
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
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
      </div>
    </div>
  )
}
