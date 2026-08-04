'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,oklch(var(--primary)/0.1),transparent_34%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_0.85fr]">
        <section className="hidden min-w-0 overflow-hidden border-r px-10 py-9 lg:flex lg:flex-col xl:px-16">
          <Link href={marketingHomeHref} className="inline-flex w-fit font-semibold transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-80">
            <BrandWordmark className="text-lg" markClassName="h-6 w-6" />
          </Link>
          <AuthUseCaseCarousel />
          <p className="text-xs text-muted-foreground">Public browser-safe keys only. Private credentials stay server-side.</p>
        </section>

        <section className="relative flex min-w-0 flex-col px-5 py-6 sm:px-8 lg:justify-center lg:px-12 xl:px-20">
          <div className="flex items-center justify-between lg:absolute lg:right-8 lg:top-8 lg:justify-end xl:right-12">
            <Link href={marketingHomeHref} className="font-semibold lg:hidden"><BrandWordmark className="text-lg" markClassName="h-6 w-6" /></Link>
            <Link href={marketingHomeHref} className="group inline-flex items-center gap-1.5 rounded-full border bg-background/75 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-[background-color,color,border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background hover:text-foreground hover:shadow-md"><ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to home</Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-[390px] py-12">
            <div className="mb-8">
              <p className="text-xs font-semibold text-primary">Your workspace</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{sent ? 'Check your inbox' : 'Continue to feedbacks.dev'}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{sent ? `We sent a secure sign-in link to ${email}.` : 'Magic link or GitHub. New accounts start Free.'}</p>
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
        </section>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return <Suspense><AuthPageInner /></Suspense>
}
