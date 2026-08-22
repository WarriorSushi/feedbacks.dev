'use client'

import * as React from 'react'
import { ArrowRight, Check, Loader2, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-7">
        <h3 className="text-xl font-semibold">All 100 places are reserved.</h3>
        <p className="mt-3 text-base leading-7 text-neutral-400">Free signup remains open, and the normal Pro-for-free referral programme is available from the dashboard.</p>
        <Button asChild size="lg" className="mt-6"><a href="https://app.feedbacks.dev/auth">Create a free account <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
      </div>
    )
  }

  if (result?.accepted) {
    const redirect = '/dashboard?tour=1'
    const href = result.accountLinked
      ? redirect
      : `/auth?redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(email)}`
    return (
      <div className="rounded-xl border border-lime-400/35 bg-neutral-900/95 p-7 shadow-2xl shadow-lime-950/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400 text-neutral-950"><Check className="h-6 w-6" /></span>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight">You’re in. Seat {result.seatNumber} is yours.</h3>
        <p className="mt-3 text-base leading-7 text-neutral-400">{result.alreadyJoined ? 'Your existing place is confirmed.' : 'Your place was accepted automatically.'} Sign in with <strong className="text-neutral-100">{email}</strong>, finish the guided tour, and Pro month one activates automatically.</p>
        <Button asChild size="lg" className="mt-7 h-12 w-full bg-lime-400 text-neutral-950 hover:bg-lime-300"><a href={href}>{result.accountLinked ? 'Start guided onboarding' : 'Create or sign in to your account'} <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl shadow-black/35 sm:p-7">
      <div className="space-y-2">
        <label htmlFor="early-adopter-email" className="block text-sm font-semibold text-neutral-100">Account email</label>
        <input id="early-adopter-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors?.email)} aria-describedby={fieldErrors?.email ? 'early-adopter-email-error' : undefined} placeholder="you@company.com" required className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-base text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20" />
        {fieldErrors?.email?.[0] ? <p id="early-adopter-email-error" className="text-sm text-red-300">{fieldErrors.email[0]}</p> : null}
      </div>

      <div className="space-y-4 border-y border-neutral-800 py-5">
        <label className="flex items-start gap-3 text-sm leading-6 text-neutral-300">
          <input type="checkbox" checked={programmeTermsAccepted} onChange={(event) => setProgrammeTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-neutral-600 accent-lime-400" />
          <span>I agree to complete the guided onboarding and provide one honest feedback check-in per earned month. I understand the two-month grace period, 12-Pro-month limit, and 14-month programme window.</span>
        </label>
        {fieldErrors?.programmeTermsAccepted?.[0] ? <p className="text-sm text-red-300">{fieldErrors.programmeTermsAccepted[0]}</p> : null}
        <label className="flex items-start gap-3 text-sm leading-6 text-neutral-400">
          <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-neutral-600 accent-lime-400" />
          <span>Also send me optional product news and practical feedback-collection notes. I can unsubscribe at any time.</span>
        </label>
      </div>
      <div className="absolute left-[-9999px]" aria-hidden="true"><label htmlFor="companyWebsite">Company website</label><input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" /></div>

      <div className="flex items-start gap-3 text-sm leading-6 text-neutral-400"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /><p>Programme reminders are service emails for the benefit you request. Advertising measurement remains controlled separately by your privacy choice.</p></div>
      {error ? <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <Button type="submit" size="lg" className="h-12 w-full bg-lime-400 text-neutral-950 hover:bg-lime-300" disabled={submitting || !email || !programmeTermsAccepted}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Join the Early Adopter Programme
      </Button>
    </form>
  )
}
