'use client'

import * as React from 'react'
import { ArrowRight, Check, Loader2, LockKeyhole } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { normalizeAppearanceTheme } from '@/lib/appearance'

type JoinResponse = {
  accepted?: boolean
  accountLinked?: boolean
  alreadyJoined?: boolean
  seatNumber?: number
  eventId?: string
  full?: boolean
  error?: string
  fieldErrors?: { email?: string[]; programmeTermsAccepted?: string[] }
}

export function LeadForm({ open }: { open: boolean }) {
  const { theme, resolvedTheme } = useTheme()
  const [email, setEmail] = React.useState('')
  const [programmeTermsAccepted, setProgrammeTermsAccepted] = React.useState(false)
  const [newsletterConsent, setNewsletterConsent] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<JoinResponse['fieldErrors']>({})
  const [error, setError] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<JoinResponse | null>(null)

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
          programmeTermsAccepted,
          newsletterConsent,
          companyWebsite: form.get('companyWebsite'),
        }),
      })
      const data = await response.json() as JoinResponse
      if (!response.ok) {
        setError(data.error || 'We could not reserve your place. Please try again.')
        setFieldErrors(data.fieldErrors || {})
        return
      }
      setResult(data)
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

  if (!open && !result) {
    return (
      <div className="rounded-xl border bg-card/95 p-7 shadow-[var(--shadow-float)]">
        <h3 className="text-xl font-semibold">All 100 places are reserved.</h3>
        <p className="mt-3 text-base leading-7 text-muted-foreground">Free signup remains open, and the normal Pro-for-free referral programme is available from the dashboard.</p>
        <Button asChild size="lg" className="mt-6"><a href="https://app.feedbacks.dev/auth">Create a free account <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
      </div>
    )
  }

  if (result?.accepted) {
    const redirect = '/dashboard?tour=1'
    const appearance = normalizeAppearanceTheme(theme || resolvedTheme)
    const authParams = new URLSearchParams({ redirect, email })
    if (appearance) authParams.set('appearance', appearance)
    const href = result.accountLinked
      ? redirect
      : `/auth?${authParams.toString()}`
    return (
      <div className="rounded-xl border border-primary/35 bg-card/95 p-7 shadow-[var(--shadow-float)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-6 w-6" /></span>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight">You’re in. Seat {result.seatNumber} is yours.</h3>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{result.alreadyJoined ? 'Your existing place is confirmed.' : 'Your place is confirmed.'} Sign in with <strong className="text-foreground">{email}</strong> and complete every step of the guided onboarding. Pro activates automatically at the end.</p>
        <Button asChild size="lg" className="mt-7 h-12 w-full"><a href={href}>{result.accountLinked ? 'Start guided onboarding' : 'Create or sign in to your account'} <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border bg-card/95 p-6 shadow-[var(--shadow-float)] sm:p-7">
      <div className="space-y-2">
        <label htmlFor="early-adopter-email" className="block text-sm font-semibold text-foreground">Account email</label>
        <input id="early-adopter-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors?.email)} aria-describedby={fieldErrors?.email ? 'early-adopter-email-error' : undefined} placeholder="you@company.com" required className="h-12 w-full rounded-lg border bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {fieldErrors?.email?.[0] ? <p id="early-adopter-email-error" className="text-sm text-destructive">{fieldErrors.email[0]}</p> : null}
      </div>

      <div className="space-y-4 border-y border-border py-5">
        <label className="flex items-start gap-3 text-sm leading-6 text-foreground/85">
          <input type="checkbox" checked={programmeTermsAccepted} onChange={(event) => setProgrammeTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
          <span>I agree to complete the guided onboarding and provide one honest feedback check-in per earned month. I understand the two-month grace period, 12-Pro-month limit, and 14-month programme window.</span>
        </label>
        {fieldErrors?.programmeTermsAccepted?.[0] ? <p className="text-sm text-destructive">{fieldErrors.programmeTermsAccepted[0]}</p> : null}
        <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
          <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
          <span>Also send me optional product news and practical feedback-collection notes. I can unsubscribe at any time.</span>
        </label>
      </div>
      <div className="absolute left-[-9999px]" aria-hidden="true"><label htmlFor="companyWebsite">Company website</label><input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" /></div>

      <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Programme reminders are service emails for the benefit you request. Advertising measurement remains controlled separately by your privacy choice.</p></div>
      {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting || !email || !programmeTermsAccepted}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Join the Early Adopter Programme
      </Button>
    </form>
  )
}
