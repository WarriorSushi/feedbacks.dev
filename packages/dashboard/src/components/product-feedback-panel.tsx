'use client'

import * as React from 'react'
import type { FeedbackType, ProductUpdateContent } from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/ui/field-error'
import { ArrowUpRight, Bug, Lightbulb, Loader2, MessageCircleQuestion, Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const feedbackTypes: Array<{ value: FeedbackType; label: string; icon: typeof Bug }> = [
  { value: 'idea', label: 'Suggestion', icon: Lightbulb },
  { value: 'bug', label: 'Problem', icon: Bug },
  { value: 'question', label: 'Question', icon: MessageCircleQuestion },
  { value: 'praise', label: 'What works', icon: Sparkles },
]

export function ProductFeedbackPanel() {
  const [type, setType] = React.useState<FeedbackType>('idea')
  const [message, setMessage] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState('')
  const [updates, setUpdates] = React.useState<ProductUpdateContent[]>([])

  React.useEffect(() => {
    let active = true
    void fetch('/api/product-feedback')
      .then((response) => response.ok ? response.json() : { updates: [] })
      .then((payload) => {
        if (active && Array.isArray(payload.updates)) setUpdates(payload.updates)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError('')
    setSent(false)
    try {
      const response = await fetch('/api/product-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Your feedback could not be sent.')
      setMessage('')
      setSent(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your feedback could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
      <div>
        <h2 className="font-semibold">Feedbacks</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what would make the product more useful.</p>
      </div>
      <div className="min-w-0 space-y-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Feedback type">
            {feedbackTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  'flex min-h-10 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  type === value ? 'border-primary/40 bg-primary/[0.07] text-foreground' : 'bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="product-feedback-message" className="sr-only">Your feedback</label>
            <Textarea
              id="product-feedback-message"
              value={message}
              onChange={(event) => { setMessage(event.target.value); setError(''); setSent(false) }}
              placeholder="What happened, or what should we build next?"
              maxLength={2_000}
              rows={4}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'product-feedback-error' : undefined}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <FieldError id="product-feedback-error">{error}</FieldError>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{message.length}/2,000</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={sending || message.trim().length < 2}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send to the team
            </Button>
            {sent && <p role="status" className="text-sm text-primary">Thank you. It is in our product inbox.</p>}
          </div>
        </form>

        <div className="border-t pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Updates from us</h3>
              <p className="mt-1 text-xs text-muted-foreground">Recent improvements and decisions from the team.</p>
            </div>
          </div>
          {updates.length > 0 ? (
            <div className="mt-4 divide-y border-y">
              {updates.slice(0, 3).map((update) => {
                const cta = update.ctas?.[0] || (update.ctaLabel && update.ctaUrl ? { label: update.ctaLabel, url: update.ctaUrl } : null)
                return (
                  <article key={update.id} className="py-4 first:pt-3 last:pb-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold">{update.title}</h4>
                      <time className="text-[11px] text-muted-foreground">{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(update.publishedAt))}</time>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{update.summary}</p>
                    {cta && <a href={cta.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{cta.label}<ArrowUpRight className="h-3 w-3" /></a>}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 border-y py-4 text-sm text-muted-foreground">Product notes will appear here when we publish them.</p>
          )}
        </div>
      </div>
    </section>
  )
}
