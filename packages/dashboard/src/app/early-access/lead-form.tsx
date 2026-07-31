'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

type FieldErrors = Partial<Record<'email' | 'newsletterConsent', string[]>>

export function LeadForm() {
  const [email, setEmail] = React.useState('')
  const [useCase, setUseCase] = React.useState('')
  const [newsletterConsent, setNewsletterConsent] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [error, setError] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [complete, setComplete] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          useCase,
          newsletterConsent,
          companyWebsite: form.get('companyWebsite'),
        }),
      })
      const data = await response.json() as { accepted?: boolean; eventId?: string; error?: string; fieldErrors?: FieldErrors }
      if (!response.ok) {
        setError(data.error || 'We could not save your request. Please try again.')
        setFieldErrors(data.fieldErrors || {})
        return
      }
      setComplete(true)
      if (data.eventId) {
        window.dispatchEvent(new CustomEvent('feedbacks:marketing-conversion', {
          detail: { eventName: 'Lead', eventId: data.eventId, email },
        }))
      }
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (complete) {
    return (
      <div className="border-y border-primary/25 bg-primary/[0.045] px-5 py-8 text-center sm:rounded-xl sm:border">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-5 w-5" /></span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">You’re on the list.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We’ll send practical launch notes and meaningful product updates—not a generic drip campaign.</p>
        <Button asChild className="mt-5"><a href="https://app.feedbacks.dev/auth">Create your free project now <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border-y bg-card px-5 py-6 shadow-[var(--shadow-soft)] sm:rounded-xl sm:border sm:p-6">
      <div className="space-y-1.5">
        <Label htmlFor="lead-email">Work email</Label>
        <Input id="lead-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'lead-email-error' : undefined} placeholder="you@company.com" required />
        {fieldErrors.email?.[0] && <p id="lead-email-error" className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-use-case">What are you building? <span className="font-normal text-muted-foreground">Optional</span></Label>
        <textarea id="lead-use-case" value={useCase} onChange={(event) => setUseCase(event.target.value)} maxLength={500} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="A SaaS dashboard, developer tool, mobile app…" />
      </div>
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <Label htmlFor="companyWebsite">Company website</Label>
        <Input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
        <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} aria-invalid={Boolean(fieldErrors.newsletterConsent)} aria-describedby={fieldErrors.newsletterConsent ? 'lead-consent-error' : undefined} className="mt-0.5 h-4 w-4 rounded border-input accent-primary" />
        <span>Email me product updates and practical feedback-collection notes. I can unsubscribe at any time.</span>
      </label>
      {fieldErrors.newsletterConsent?.[0] && <p id="lead-consent-error" className="text-xs text-destructive">{fieldErrors.newsletterConsent[0]}</p>}
      {error && <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
      <Button type="submit" className="h-11 w-full" disabled={submitting || !email || !newsletterConsent}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Join the launch list
      </Button>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">Joining the list does not create an account. Advertising measurement is controlled separately by your privacy choice.</p>
    </form>
  )
}
