'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, Check, Github, KeyRound, Loader2, Mail, MessageSquare, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sanitizeRedirectPath } from '@/lib/redirects'

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
  const searchParams = useSearchParams()
  const redirect = sanitizeRedirectPath(searchParams.get('redirect'), '/projects/new')
  const encodedRedirect = encodeURIComponent(redirect)
  const supabase = React.useMemo(() => createClient(), [])
  const callbackError = searchParams.get('error')

  React.useEffect(() => {
    if (!callbackError) return
    setError(
      callbackError === 'auth_failed'
        ? 'That sign-in link is expired, already used, or was opened in the wrong browser. Request a new link below.'
        : 'Sign in could not be completed. Please try again.',
    )
  }, [callbackError])

  React.useEffect(() => {
    if (resendSeconds <= 0) return
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  const handlePasswordSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) return setError('The email or password was not accepted. Check both fields or request a secure sign-in link.')
    window.location.href = redirect
  }

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault()
    setMagicLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodedRedirect}` },
    })
    setMagicLoading(false)
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
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,oklch(var(--primary)/0.1),transparent_34%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_0.85fr]">
        <section className="hidden border-r px-10 py-9 lg:flex lg:flex-col xl:px-16">
          <Link href="/" className="inline-flex w-fit font-semibold transition-opacity hover:opacity-80">
            <BrandWordmark className="text-lg" markClassName="h-6 w-6" />
          </Link>
          <div className="my-auto max-w-xl py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">First value in minutes</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] xl:text-5xl">A small setup path.<br />A complete feedback loop.</h2>
            <p className="mt-5 max-w-lg leading-7 text-muted-foreground">Sign in, create one project, install one shared embed, and send a test. Everything else can wait until the connection works.</p>

            <div className="mt-10 overflow-hidden border-y border-foreground/15">
              <div className="grid sm:grid-cols-2">
                <div className="border-b p-5 sm:border-b-0 sm:border-r">
                  <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-primary" /> Feedback form</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Users send bugs, ideas, questions, ratings, and screenshots to your inbox.</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Megaphone className="h-4 w-4 text-amber-500" /> Updates for your users</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">You publish clear “What’s new” announcements back inside your product.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t bg-primary/[0.035] px-5 py-4 text-xs text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" /><span><strong className="text-foreground">One embed for both.</strong> Install it once and manage configuration remotely.</span>
              </div>
            </div>

            <ol className="mt-8 grid grid-cols-3 border-y">
              {['Create project', 'Install once', 'Verify a test'].map((step, index) => (
                <li key={step} className="border-l px-3 py-4 first:border-l-0 first:pl-0">
                  <span className="font-mono text-[10px] text-primary">0{index + 1}</span>
                  <p className="mt-1 text-xs font-semibold">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">Public browser-safe keys only. Private credentials stay server-side.</p>
        </section>

        <section className="flex min-w-0 flex-col px-5 py-6 sm:px-8 lg:justify-center lg:px-12 xl:px-20">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" className="font-semibold"><BrandWordmark className="text-lg" markClassName="h-6 w-6" /></Link>
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-[390px] py-12">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your workspace</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{sent ? 'Check your inbox' : 'Sign in or create an account'}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{sent ? `We sent a secure sign-in link to ${email}.` : 'New here? GitHub or a magic link creates your account and opens project setup automatically.'}</p>
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
                  {error && <p role="alert" aria-live="assertive" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
                  <Button className="h-11 w-full" type="submit" disabled={magicLoading || !email}>{magicLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Email me a secure sign-in link</Button>
                </form>

                <Button variant="outline" className="group h-11 w-full justify-between" onClick={handleGitHub} disabled={githubLoading}>
                  <span className="flex items-center gap-2.5">{githubLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}Continue with GitHub</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Button>

                <div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-[11px] text-muted-foreground">existing password account</span><Separator className="flex-1" /></div>

                {showPassword ? (
                  <form onSubmit={handlePasswordSignIn} className="space-y-3">
                    <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11" required /></div>
                    <Button variant="secondary" className="h-11 w-full" type="submit" disabled={loading || !email}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}Sign in with password</Button>
                  </form>
                ) : (
                  <Button variant="ghost" className={cn('h-10 w-full', !email && 'opacity-60')} type="button" disabled={!email} onClick={() => setShowPassword(true)}>Use password instead</Button>
                )}
                <p className="text-center text-xs leading-5 text-muted-foreground">A magic link creates your account if you are new and returns you to the page you requested.</p>
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
