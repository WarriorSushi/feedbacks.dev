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
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const draftKey = `feedbacks:board-draft:${slug}`
  const [title, setTitle] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [type, setType] = React.useState(showTypes[0] || 'idea')
  const [email, setEmail] = React.useState('')
  const [hp, setHp] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<BoardSuggestion[]>([])
  const message = [title.trim(), details.trim()].filter(Boolean).join('\n')
  const deferredMessage = React.useDeferredValue(message)

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(draftKey) || 'null') as {
        title?: string
        details?: string
        type?: string
        email?: string
      } | null
      if (!saved) return
      if (typeof saved.title === 'string') setTitle(saved.title)
      if (typeof saved.details === 'string') setDetails(saved.details)
      if (typeof saved.type === 'string' && showTypes.includes(saved.type)) setType(saved.type)
      if (typeof saved.email === 'string') setEmail(saved.email)
    } catch {
      // A corrupt browser draft is ignored without blocking submission.
    }
  }, [draftKey, showTypes])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(draftKey, JSON.stringify({ title, details, type, email }))
      } catch {
        // Storage can be disabled; the in-memory draft remains available.
      }
    }, 150)
    return () => window.clearTimeout(timer)
  }, [details, draftKey, email, title, type])

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
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'),
      ).filter((element) => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [onClose])

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
      window.sessionStorage.removeItem(draftKey)
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-submit-modal-title"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5">
          <div>
            <h2
              id="board-submit-modal-title"
              className="text-xl font-semibold text-foreground"
            >
              Share an idea or bug
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/68">Say what you need and why it would help.</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-5 p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Is this an idea or a bug?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {showTypes.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setType(entry)}
                  aria-pressed={type === entry}
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

          <div className="space-y-2">
            <label htmlFor="board-post-title" className="text-sm font-medium text-foreground">What do you need?</label>
            <input id="board-post-title" value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary" placeholder="For example: Let me sort by date" required minLength={5} maxLength={140}/>
          </div>

          <div className="space-y-2">
            <label htmlFor="board-post-details" className="text-sm font-medium text-foreground">Why would this help? <span className="font-normal text-muted-foreground">Optional</span></label>
            <textarea
            id="board-post-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            className="min-h-[112px] w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            placeholder="Add a short example or tell the team where you got stuck."
            maxLength={1850}
          />
          </div>

          <div>
            <label htmlFor="board-post-email" className="mb-2 block text-sm font-medium text-foreground">Email <span className="font-normal text-muted-foreground">Optional</span></label>
            <input
              id="board-post-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">The team can use this to ask a question. It is not shown on the board.</p>
          </div>

          <input
            value={hp}
            onChange={(event) => setHp(event.target.value)}
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
          />

          {suggestions.length > 0 && (
            <div className="rounded-xl border border-border/70 bg-background px-4 py-4">
              <p className="text-sm font-semibold text-foreground">This may already be on the board</p>
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

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={submitting || title.trim().length < 5}
              className="px-4 font-semibold"
            >
              {submitting ? 'Posting…' : 'Post to board'}
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
