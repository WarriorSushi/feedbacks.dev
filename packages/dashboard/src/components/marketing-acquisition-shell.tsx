import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Github } from 'lucide-react'
import { BrandWordmark } from '@/components/brand-wordmark'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { PrivacyChoicesButton } from '@/components/privacy-choices-button'
import { publicEnv } from '@/lib/public-env'

const authHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/auth`

export function MarketingAcquisitionShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen bg-background text-foreground">
      <header className="landing-header sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="shrink-0 font-semibold transition-opacity hover:opacity-80">
            <BrandWordmark className="text-lg" textClassName="hidden sm:inline" priority />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Acquisition pages">
            <Button asChild variant="ghost" size="sm"><Link href="/feedback-widget">Feedback widget</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/feedback-widget/nextjs">Next.js guide</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/canny-alternative">Compare Canny</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/docs" prefetch={false}>Docs</Link></Button>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle landing />
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-md px-2 py-2 text-sm font-medium hover:bg-accent">Menu</summary>
              <nav className="absolute right-0 top-11 z-50 grid min-w-52 gap-1 rounded-lg border bg-popover p-2 shadow-[var(--shadow-float)]" aria-label="Mobile acquisition pages">
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/feedback-widget">Feedback widget</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/feedback-widget/nextjs">Next.js guide</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/canny-alternative">Compare Canny</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/docs" prefetch={false}>Docs</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href={authHref}>Sign in</Link>
              </nav>
            </details>
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex"><Link href={authHref}>Sign in</Link></Button>
            <Button asChild size="sm" className="gap-1.5"><Link href={authHref}>Start free <ArrowRight className="hidden h-3.5 w-3.5 sm:block" /></Link></Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t px-5 py-8 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <BrandWordmark className="text-sm font-semibold" markClassName="h-5 w-5" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Footer">
            <Link href="/feedback-widget">Widget</Link>
            <Link href="/feedback-widget/nextjs">Next.js</Link>
            <Link href="/canny-alternative">Canny alternative</Link>
            <Link href="/docs" prefetch={false}>Docs</Link>
            <Link href="/privacy">Privacy</Link>
            <PrivacyChoicesButton />
            <Link href="/terms">Terms</Link>
          </nav>
          <a href="https://github.com/WarriorSushi/Feedbacks.dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground md:justify-self-end"><Github className="h-4 w-4" /> Source available</a>
        </div>
      </footer>
    </div>
  )
}

export function MarketingCodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-surface-code text-surface-code-foreground shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold text-white/70">{label}</span>
        <span className="font-mono text-[10px] text-white/40">copy from your Install tab</span>
      </div>
      <pre className="overflow-x-auto p-5 text-[13px] leading-6"><code>{code}</code></pre>
    </div>
  )
}

export function MarketingFinalCta({
  title,
  body,
  secondaryHref = '/docs/quickstart',
  secondaryLabel = 'Read the quickstart',
}: {
  title: string
  body: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <section className="landing-section landing-section-aurora border-t px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{body}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 w-full gap-2 px-7 sm:w-auto"><Link href={authHref}>Create a free project <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto"><Link href={secondaryHref} prefetch={false}>{secondaryLabel}</Link></Button>
        </div>
      </div>
    </section>
  )
}
