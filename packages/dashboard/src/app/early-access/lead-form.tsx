'use client'

import * as React from 'react'
import { ArrowRight, Check, Loader2, LockKeyhole } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { normalizeAppearanceTheme } from '@/lib/appearance'
import { AuthCaptcha } from '@/components/auth-captcha'

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
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0)
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaProvider = hcaptchaSiteKey ? 'hcaptcha' : turnstileSiteKey ? 'turnstile' : null
  const captchaSiteKey = hcaptchaSiteKey || turnstileSiteKey
  const captchaUnavailable = process.env.NODE_ENV === 'production' && !captchaProvider

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    if (captchaUnavailable) {
      setError('Bot protection is temporarily unavailable. Please try again shortly.')
      return
    }
    if (captchaProvider && !captchaToken) {
      setError('Complete the short bot check, then continue.')
      return
    }
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
          captchaToken,
        }),
      })
      const data = await response.json() as JoinResponse
      if (!response.ok) {
        setError(data.error || 'We could not prepare your programme claim. Please try again.')
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
      if (captchaProvider) setCaptchaResetKey((current) => current + 1)
    }
  }

  if (!open && !result) {
    return (
      <div className="rounded-xl border bg-card/95 p-7 shadow-[var(--shadow-float)]">
        <h3 className="text-xl font-semibold">All 100 places have been claimed.</h3>
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
    const placeConfirmed = typeof result.seatNumber === 'number'
    return (
      <div className="rounded-xl border border-primary/35 bg-card/95 p-7 shadow-[var(--shadow-float)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-6 w-6" /></span>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight">{placeConfirmed ? `Seat ${result.seatNumber} is confirmed.` : 'Your place is ready to claim.'}</h3>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{placeConfirmed ? 'Your programme place is active.' : <>Sign in with <strong className="text-foreground">{email}</strong> and complete the required guided onboarding. Your place is confirmed and Pro unlocks when you finish. Email submission alone does not use one of the 100 places.</>}</p>
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
          <span>I agree to complete the guided onboarding to claim a place and provide one honest feedback check-in per earned month. I understand the two-month grace period, 12-Pro-month limit, and 14-month programme window.</span>
        </label>
        {fieldErrors?.programmeTermsAccepted?.[0] ? <p className="text-sm text-destructive">{fieldErrors.programmeTermsAccepted[0]}</p> : null}
        <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
          <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
          <span>Also send me optional product news and practical feedback-collection notes. I can unsubscribe at any time.</span>
        </label>
      </div>
      <div className="absolute left-[-9999px]" aria-hidden="true"><label htmlFor="companyWebsite">Company website</label><input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" /></div>

      {captchaProvider && captchaSiteKey ? (
        <div className="rounded-lg border border-border bg-background/70 px-3 py-2">
          <AuthCaptcha
            provider={captchaProvider}
            siteKey={captchaSiteKey}
            resetKey={captchaResetKey}
            onToken={setCaptchaToken}
            action="early_adopter_claim"
          />
        </div>
      ) : null}

      <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Programme reminders are service emails for the benefit you request. Advertising measurement remains controlled separately by your privacy choice.</p></div>
      {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" className="h-12 w-full" disabled={submitting || !email || !programmeTermsAccepted || captchaUnavailable || Boolean(captchaProvider && !captchaToken)}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue to claim a programme place
      </Button>
    </form>
  )
}
