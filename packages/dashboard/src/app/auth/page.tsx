'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, Github, KeyRound, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sanitizeRedirectPath } from '@/lib/redirects'
import { AuthCaptcha } from '@/components/auth-captcha'
import { AuthUseCaseCarousel } from '@/components/auth-use-case-carousel'
import { SITE_ORIGIN } from '@/lib/site'

const marketingHomeHref = process.env.NEXT_PUBLIC_MARKETING_ORIGIN
  || (process.env.NODE_ENV === 'development' ? '/' : SITE_ORIGIN)

function AuthPageInner() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [magicLoading, setMagicLoading] = React.useState(false)
  const [githubLoading, setGithubLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [resendSeconds, setResendSeconds] = React.useState(0)
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0)
  const searchParams = useSearchParams()
  const redirect = sanitizeRedirectPath(searchParams.get('redirect'), '/projects/new')
  const encodedRedirect = encodeURIComponent(redirect)
  const supabase = React.useMemo(() => createClient(), [])
  const callbackError = searchParams.get('error')
  const invited = searchParams.get('invited') === '1'
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const captchaProvider = hcaptchaSiteKey ? 'hcaptcha' : turnstileSiteKey ? 'turnstile' : null
  const captchaSiteKey = hcaptchaSiteKey || turnstileSiteKey

  React.useEffect(() => {
    if (!callbackError) return
    const messages: Record<string, string> = {
      auth_failed: 'That sign-in link is expired, already used, or was opened in the wrong browser. Request a new link below.',
      invalid_invite: 'That invitation link is not valid. You can still create a free account below.',
      invite_complete: 'That invitation has filled all five spots. You can still create a free account below.',
    }
    setError(messages[callbackError] || 'Sign in could not be completed. Please try again.')
  }, [callbackError])

  React.useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  const handlePasswordSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (captchaProvider && !captchaToken) {
      setError('Complete the short bot check, then continue.')
      return
    }
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken || undefined },
    })
    setLoading(false)
    if (captchaProvider) setCaptchaResetKey((current) => current + 1)
    if (authError) return setError('The email or password was not accepted. Check both fields or request a secure sign-in link.')
    window.location.href = redirect
  }

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault()
    if (captchaProvider && !captchaToken) {
      setError('Complete the short bot check, then continue.')
      return
    }
    setMagicLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodedRedirect}`,
        captchaToken: captchaToken || undefined,
      },
    })
    setMagicLoading(false)
    if (captchaProvider) setCaptchaResetKey((current) => current + 1)
    if (authError) setError('We could not send a sign-in link right now. Wait a moment, then try again or contact support.')
    else {
      setSent(true)
      setResendSeconds(60)
    }
  }

  const handleGitHub = async () => {
    setGithubLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodedRedirect}` },
    })
  }

  return (
    <main className="auth-shell relative min-h-screen overflow-hidden bg-background">
      <div className="auth-shell-atmosphere pointer-events-none absolute inset-0" aria-hidden="true" />
      <Link href={marketingHomeHref} className="auth-back-home group absolute left-5 top-5 z-30 inline-flex items-center gap-1.5 rounded-md border bg-background/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background hover:text-foreground sm:left-8 sm:top-8">
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to home
      </Link>

      <div className="relative grid min-h-screen w-full lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
        <section className="auth-story-pane hidden min-w-0 overflow-hidden border-r px-10 py-20 lg:flex lg:flex-col xl:px-16">
          <div className="mx-auto flex w-full max-w-[720px] flex-1">
            <AuthUseCaseCarousel displayMode="desktop" />
          </div>
        </section>

        <section className="auth-form-pane relative flex min-w-0 flex-col px-5 pb-6 pt-20 sm:px-8 sm:pt-24 lg:justify-center lg:px-12 lg:py-20 xl:px-20">
          <div className="auth-form-wrap mx-auto my-auto w-full max-w-[390px] py-8 lg:py-12">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{sent ? 'Check your inbox' : 'Sign in or create an account'}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{sent ? `We sent a secure sign-in link to ${email}.` : 'Use email or GitHub. New accounts start on the Free plan.'}</p>
              {invited && !sent && <p className="mt-3 rounded-md border border-primary/25 bg-primary/[0.05] px-3 py-2 text-xs leading-5 text-foreground">You were invited by another feedbacks.dev user. Their invite qualifies after you verify your email and genuinely activate your first project.</p>}
            </div>

            {sent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/[0.055] p-4">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div><p className="text-sm font-semibold">Magic link sent</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Open the newest email in this browser and device. The link expires in 24 hours and can be used once.</p></div>
                </div>
                <p aria-live="polite" className="sr-only">A secure sign-in link was sent to {email}.</p>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={magicLoading || resendSeconds > 0}
                  onClick={(event) => void handleMagicLink(event as unknown as React.FormEvent)}
                >
                  {resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : 'Resend sign-in link'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail('') }}>Use a different email</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11" required autoFocus /></div>
                  {captchaProvider && captchaSiteKey && (
                    <AuthCaptcha
                      provider={captchaProvider}
                      siteKey={captchaSiteKey}
                      resetKey={captchaResetKey}
                      onToken={setCaptchaToken}
                    />
                  )}
                  {error && <p role="alert" aria-live="assertive" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
                  <Button className="h-11 w-full" type="submit" disabled={magicLoading || !email}>{magicLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Continue with email</Button>
                </form>

                <Button variant="outline" className="group h-11 w-full justify-between" onClick={handleGitHub} disabled={githubLoading}>
                  <span className="flex items-center gap-2.5">{githubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}Continue with GitHub</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Button>

                <div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-[11px] text-muted-foreground">Password</span><Separator className="flex-1" /></div>

                {showPassword ? (
                  <form onSubmit={handlePasswordSignIn} className="space-y-3">
                    <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11" required /></div>
                    <Button variant="secondary" className="h-11 w-full" type="submit" disabled={loading || !email}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Sign in with password</Button>
                  </form>
                ) : (
                  <Button variant="ghost" className={cn('h-10 w-full', !email && 'opacity-60')} type="button" disabled={!email} onClick={() => setShowPassword(true)}>Use password instead</Button>
                )}
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-5 text-muted-foreground">By continuing, you agree to our <Link href="/terms" prefetch={false} className="underline underline-offset-2 hover:text-foreground">Terms</Link> and <Link href="/privacy" prefetch={false} className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>. Need help? <a className="underline underline-offset-2 hover:text-foreground" href="mailto:pashaseenainc@gmail.com">Contact support</a>.</p>
          </div>

          <div className="mx-auto w-full max-w-[440px] pb-5 lg:hidden">
            <AuthUseCaseCarousel compact displayMode="mobile" />
          </div>
        </section>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return <Suspense><AuthPageInner /></Suspense>
}
