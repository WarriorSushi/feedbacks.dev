'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, Bug, Github, KeyRound, Lightbulb, Loader2, Mail, MessageSquare, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sanitizeRedirectPath } from '@/lib/redirects'
import { AuthCaptcha } from '@/components/auth-captcha'

const authStories = [
  {
    label: 'Catch the invisible bug',
    title: 'The report arrives with the page and browser already attached.',
    body: 'A user explains the problem once. Your inbox keeps the context your team needs to reproduce it.',
    note: 'Useful for SaaS products and internal tools',
    icon: Bug,
  },
  {
    label: 'Find the next useful bet',
    title: 'Turn scattered requests into a small, credible product signal.',
    body: 'Collect ideas in-product, triage them privately, and publish the strongest ones to a voting board.',
    note: 'Useful for founders and product engineers',
    icon: Lightbulb,
  },
  {
    label: 'Close the loop',
    title: 'Tell the people who asked when the improvement is ready.',
    body: 'Publish a concise product update through the same embed. No second installation or announcement tool.',
    note: 'Useful for teams that ship every week',
    icon: Megaphone,
  },
] as const

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
  const [storyIndex, setStoryIndex] = React.useState(0)
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

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(
      () => setStoryIndex((current) => (current + 1) % authStories.length),
      6_500,
    )
    return () => window.clearTimeout(timer)
  }, [storyIndex])

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
        <section className="hidden border-r px-10 py-9 lg:flex lg:flex-col xl:px-16">
          <Link href="/" className="inline-flex w-fit font-semibold transition-opacity hover:opacity-80">
            <BrandWordmark className="text-lg" markClassName="h-6 w-6" />
          </Link>
          <div className="my-auto max-w-xl py-16">
            <p className="text-xs font-semibold text-primary">Feedback that earns its place in your product</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] xl:text-5xl">Hear what matters.<br />Ship the right fix.</h2>
            <p className="mt-5 max-w-lg leading-7 text-muted-foreground">One lightweight embed connects user reports, your triage inbox, and the update that closes the loop.</p>

            <div className="mt-12 border-y border-foreground/15 py-7" aria-live="polite">
              {(() => {
                const story = authStories[storyIndex]
                const StoryIcon = story.icon
                return (
                  <div key={story.label}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary"><StoryIcon className="h-4 w-4" />{story.label}</div>
                    <h3 className="mt-4 max-w-lg text-xl font-semibold leading-7 tracking-[-0.02em]">{story.title}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{story.body}</p>
                    <p className="mt-5 text-xs text-muted-foreground">{story.note}</p>
                  </div>
                )
              })()}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex gap-2" aria-label="Choose a use case">
                {authStories.map((story, index) => (
                  <button
                    key={story.label}
                    type="button"
                    aria-label={`Show ${story.label}`}
                    aria-pressed={storyIndex === index}
                    onClick={() => setStoryIndex(index)}
                    className={cn('h-1.5 rounded-full transition-[width,background-color] duration-200', storyIndex === index ? 'w-8 bg-primary' : 'w-3 bg-foreground/20 hover:bg-foreground/35')}
                  />
                ))}
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare className="h-3.5 w-3.5 text-primary" />Install once. Configure remotely.</p>
            </div>
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
