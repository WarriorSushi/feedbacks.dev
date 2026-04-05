'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { generateInstallSnippets } from '@feedbacks/shared'
import { createClient } from '@/lib/supabase-browser'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Github, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
// Password login removed — magic link only
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const features = [
  'Sign in and land on project setup with the install snippet ready',
  'Start with the Website snippet, then verify one real submission',
  'Capture URL, browser context, and optional screenshots automatically',
  'Add routing and public boards after the core loop is working',
]

const codeSnippet = generateInstallSnippets({
  projectKey: 'your-project-key',
  appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN,
}).find((snippet) => snippet.label === 'Website')?.code || ''

function AuthPageInner() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [githubLoading, setGithubLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState('')
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const supabase = React.useMemo(() => createClient(), [])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  const handleGitHub = async () => {
    setGithubLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[hsl(238_28%_99%)] dark:bg-[hsl(238_22%_8%)]">

      {/* ── Left panel: brand/feature cover ──────────────────────────────── */}
      <div className="relative hidden w-[52%] shrink-0 overflow-hidden lg:flex">

        {/* Dark indigo base */}
        <div className="absolute inset-0 bg-[hsl(238_40%_10%)]" />

        {/* Animated gradient blobs */}
        <div
          className="blob-drift-1 absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, hsl(238 70% 52%) 0%, transparent 70%)',
            filter: 'blur(64px)',
          }}
        />
        <div
          className="blob-drift-2 absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, hsl(258 60% 58%) 0%, transparent 70%)',
            filter: 'blur(72px)',
          }}
        />
        <div
          className="blob-drift-3 absolute bottom-1/3 left-1/3 h-[260px] w-[260px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, hsl(220 80% 65%) 0%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />

        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Top: logo */}
          <Link
            href="/"
            className="inline-flex items-baseline gap-[2px] text-xl font-semibold tracking-tight text-white/90"
          >
            feedbacks
            <span className="text-[hsl(238_72%_78%)]">.dev</span>
          </Link>

          {/* Middle: headline + features */}
          <div className="mt-auto">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(238_72%_78%)]">
              First-run setup
            </p>
            <h1 className="max-w-sm text-4xl font-bold leading-[1.1] text-white xl:text-[2.75rem]">
              Sign in,
              <br />
              create the project,
              <br />
              paste the snippet.
            </h1>

            <ul className="mt-8 space-y-3">
              {features.map((f, i) => (
                <li
                  key={f}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <CheckCircle2 className="mt-[2px] h-4 w-4 shrink-0 text-[hsl(238_72%_78%)]" />
                  <span className="text-[15px] text-white/70">{f}</span>
                </li>
              ))}
            </ul>

            {/* Code snippet */}
            <div className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 text-[11px] text-white/30">index.html</span>
              </div>
              <pre className="scrollbar-thin overflow-x-auto px-5 py-4 text-[13px] leading-relaxed">
                <code>
                  {codeSnippet.split('\n').map((line, i) => (
                    <span key={i} className="block">
                      {line.trim().startsWith('data-project') ? (
                        <>
                          <span className="text-[hsl(220_80%_75%)]">  data-project</span>
                          <span className="text-white/40">{`="`}</span>
                          <span className="text-[hsl(150_60%_68%)]">your-project-key</span>
                          <span className="text-white/40">{`"`}</span>
                        </>
                      ) : line.trim().startsWith('data-api-url') ? (
                        <>
                          <span className="text-[hsl(220_80%_75%)]">  data-api-url</span>
                          <span className="text-white/40">{`="`}</span>
                          <span className="text-[hsl(150_60%_68%)]">{publicEnv.NEXT_PUBLIC_APP_ORIGIN}/api/feedback</span>
                          <span className="text-white/40">{`"`}</span>
                        </>
                      ) : line.includes('script') ? (
                        <span className="text-white/55">{line}</span>
                      ) : (
                        <span className="text-white/40">{line}</span>
                      )}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: auth form ────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">

        {/* Mobile logo */}
        <div className="mb-10 text-center lg:hidden">
          <Link
            href="/"
            className="inline-flex items-baseline gap-[2px] text-xl font-semibold tracking-tight"
          >
            feedbacks<span className="text-primary">.dev</span>
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Sign in and start setup.
          </h1>
        </div>

        <div className="w-full max-w-[360px] animate-fade-in">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {sent ? 'Check your inbox' : 'Sign in to start setup'}
            </h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {sent
                ? `We sent a magic link to ${email}`
                : 'You will land on project setup with the install snippet, verify flow, and first-run checklist.'}
            </p>
          </div>

          {sent ? (
            /* ── Sent state ────────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-[hsl(var(--primary)/0.06)] p-4">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[13px] font-medium">Magic link sent</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Click the link in your email to sign in. It expires in 24 hours.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full text-[13px] text-muted-foreground"
                onClick={() => { setSent(false); setEmail('') }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            /* ── Sign-in form ──────────────────────────────────────────── */
            <div className="space-y-3">
              {/* GitHub */}
              <Button
                variant="outline"
                className={cn(
                  'group w-full justify-between border-border/80 text-[13px]',
                  'transition-all duration-200 hover:border-foreground/20 hover:bg-accent'
                )}
                onClick={handleGitHub}
                disabled={githubLoading}
                >
                  <span className="flex items-center gap-2.5">
                    {githubLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Github className="h-4 w-4" />
                    )}
                  Continue with GitHub
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>

              {/* Divider */}
              <div className="relative my-1 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="shrink-0 text-[11px] text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              {/* Email form */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px]">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border-border/80 text-[14px] transition-colors focus:border-primary/60"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-destructive">{error}</p>
                )}

                <Button
                  className="w-full text-[13px]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send magic link and continue setup
                </Button>
              </form>
            </div>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}
