'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import {
  BETA_STAGE_OPTIONS,
  BETA_TIMELINE_OPTIONS,
  type BetaApplicationFieldErrors,
} from '@/lib/beta-application'

export function LeadForm() {
  const [email, setEmail] = React.useState('')
  const [useCase, setUseCase] = React.useState('')
  const [applicationStage, setApplicationStage] = React.useState('')
  const [installTimeline, setInstallTimeline] = React.useState('')
  const [currentTool, setCurrentTool] = React.useState('')
  const [newsletterConsent, setNewsletterConsent] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<BetaApplicationFieldErrors>({})
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
          applicationStage,
          installTimeline,
          currentTool,
          newsletterConsent,
          companyWebsite: form.get('companyWebsite'),
        }),
      })
      const data = await response.json() as { accepted?: boolean; eventId?: string; error?: string; fieldErrors?: BetaApplicationFieldErrors }
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
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Application received.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We review applications in small batches and email invitations as space opens. You do not need to wait to use the Free plan.</p>
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
        <Label htmlFor="lead-use-case">What are you building, and where does feedback break down?</Label>
        <textarea id="lead-use-case" value={useCase} onChange={(event) => setUseCase(event.target.value)} minLength={20} maxLength={500} rows={4} aria-invalid={Boolean(fieldErrors.useCase)} aria-describedby={fieldErrors.useCase ? 'lead-use-case-error' : undefined} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="We run a developer tool with 80 active users. Bug reports arrive in Discord without the page or browser context…" required />
        {fieldErrors.useCase?.[0] && <p id="lead-use-case-error" className="text-xs text-destructive">{fieldErrors.useCase[0]}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-stage">Product stage</Label>
          <select id="lead-stage" value={applicationStage} onChange={(event) => setApplicationStage(event.target.value)} aria-invalid={Boolean(fieldErrors.applicationStage)} aria-describedby={fieldErrors.applicationStage ? 'lead-stage-error' : undefined} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" required>
            <option value="">Choose one</option>
            {BETA_STAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {fieldErrors.applicationStage?.[0] && <p id="lead-stage-error" className="text-xs text-destructive">{fieldErrors.applicationStage[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-timeline">Install timing</Label>
          <select id="lead-timeline" value={installTimeline} onChange={(event) => setInstallTimeline(event.target.value)} aria-invalid={Boolean(fieldErrors.installTimeline)} aria-describedby={fieldErrors.installTimeline ? 'lead-timeline-error' : undefined} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" required>
            <option value="">Choose one</option>
            {BETA_TIMELINE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {fieldErrors.installTimeline?.[0] && <p id="lead-timeline-error" className="text-xs text-destructive">{fieldErrors.installTimeline[0]}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-current-tool">What do you use today? <span className="font-normal text-muted-foreground">Optional</span></Label>
        <Input id="lead-current-tool" value={currentTool} onChange={(event) => setCurrentTool(event.target.value)} maxLength={120} aria-invalid={Boolean(fieldErrors.currentTool)} aria-describedby={fieldErrors.currentTool ? 'lead-current-tool-error' : undefined} placeholder="Discord, email, Canny, a custom form…" />
        {fieldErrors.currentTool?.[0] && <p id="lead-current-tool-error" className="text-xs text-destructive">{fieldErrors.currentTool[0]}</p>}
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
        Apply for the Founding Beta
      </Button>
      <p className="text-center text-[11px] leading-4 text-muted-foreground">Applying does not create an account or block Free signup. Advertising measurement is controlled separately by your privacy choice.</p>
    </form>
  )
}
