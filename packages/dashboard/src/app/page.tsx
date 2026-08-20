import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Gauge, Github, LockKeyhole, Route } from 'lucide-react'
import { PLAN_MATRIX, generateInstallSnippets } from '@feedbacks/shared'
import { AuthenticatedRedirect } from './authenticated-redirect'
import { BrandWordmark } from '@/components/brand-wordmark'
import { LandingProductStories } from '@/components/landing-product-stories'
import { LandingScrollHeader } from '@/components/landing-scroll-header'
import { LandingSectionObserver } from '@/components/landing-section-observer'
import { LandingTryWidgetHero } from '@/components/landing-try-widget-hero'
import { LandingVibeInstall } from '@/components/landing-vibe-install'
import { PrivacyChoicesButton } from '@/components/privacy-choices-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'

const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
const authHref = `${appOrigin}/auth`
const proAuthHref = `${authHref}?redirect=${encodeURIComponent('/billing?intent=pro')}`
const dashboardHref = `${appOrigin}/dashboard`

const installSnippet = generateInstallSnippets({ projectKey: 'your-project-key', appOrigin })
  .find((snippet) => snippet.label === 'Website')?.code || ''
const freePlan = PLAN_MATRIX.free
const proPlan = PLAN_MATRIX.pro

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', url: SITE_ORIGIN, siteName: 'feedbacks.dev',
    title: 'feedbacks.dev | Feedback forms and product updates',
    description: 'Collect useful in-product feedback, triage it quickly, and show users what shipped with one lightweight embed.',
  },
  twitter: {
    card: 'summary_large_image', title: 'feedbacks.dev | Feedback forms and product updates',
    description: 'Collect useful in-product feedback, triage it quickly, and show users what shipped with one lightweight embed.',
  },
}

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'feedbacks.dev',
  applicationCategory: 'DeveloperApplication', operatingSystem: 'Web', url: SITE_ORIGIN,
  description: 'Collect in-product feedback and publish product updates with one lightweight embed.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: freePlan.monthlyPrice, priceCurrency: 'USD' },
    { '@type': 'Offer', name: 'Pro', price: proPlan.monthlyPrice, priceCurrency: 'USD' },
  ],
  featureList: ['In-product feedback form', 'Feedback inbox and triage', 'Product updates', 'Public feedback boards', 'Slack, Discord, GitHub, and webhook integrations', 'REST API and MCP server'],
}

const proofPoints = [
  { Icon: Gauge, value: 'Under 20KB', label: 'Gzip widget budget' },
  { Icon: LockKeyhole, value: 'Browser-safe', label: 'Public project keys' },
  { Icon: Route, value: 'One inbox', label: 'Context, screenshot, routing' },
] as const

export default function LandingPage() {
  return (
    <div className="marketing-shell min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, '\\u003c') }} />
      <AuthenticatedRedirect appOrigin={appOrigin} />

      <LandingScrollHeader>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="font-semibold transition-opacity hover:opacity-80"><BrandWordmark className="text-lg" textClassName="hidden sm:inline" priority /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <Link href="#product"><Button variant="ghost" size="sm">Product</Button></Link>
            <Link href="#setup"><Button variant="ghost" size="sm">Install</Button></Link>
            <Link href="#pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/docs" prefetch={false}><Button variant="ghost" size="sm">Docs</Button></Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle landing />
            <details className="relative lg:hidden">
              <summary className="cursor-pointer list-none rounded-md px-2 py-2 text-sm font-medium hover:bg-accent">Menu</summary>
              <nav className="absolute right-0 top-11 z-50 grid min-w-44 gap-1 rounded-lg border bg-popover p-2 shadow-[var(--shadow-float)]" aria-label="Mobile navigation">
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="#product">Product</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="#setup">Install</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="#pricing">Pricing</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/docs" prefetch={false}>Docs</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href={authHref}>Sign in</Link>
              </nav>
            </details>
            <Link href={authHref} className="hidden lg:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href={authHref}><Button size="sm" className="gap-1.5">Start free <ArrowRight className="hidden h-3.5 w-3.5 sm:block" /></Button></Link>
          </div>
        </div>
      </LandingScrollHeader>

      <main>
        <LandingSectionObserver />
        <LandingTryWidgetHero />

        <LandingProductStories />

        <section id="setup" className="landing-section landing-section-warm landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <LandingVibeInstall snippet={installSnippet} />
            <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-6 text-muted-foreground">Save the form in the dashboard and the installed widget updates remotely. No ritual reinstall required.</p>
          </div>
        </section>

        <section className="landing-proof-strip landing-reveal border-b">
          <div className="mx-auto grid max-w-7xl divide-y px-5 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {proofPoints.map(({ Icon, value, label }) => (
              <div key={value} className="flex items-center gap-5 py-9 md:px-8 first:pl-0 last:pr-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card"><Icon className="h-5 w-5 text-primary" /></span>
                <div><p className="text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="landing-section landing-section-sky landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mb-10 max-w-2xl"><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Start free. Pay when the inbox gets interesting.</h2></div>
            <div className="grid overflow-hidden rounded-2xl border bg-card md:grid-cols-2">
              <div className="p-6 sm:p-9">
                <p className="text-sm font-semibold">Free</p><p className="mt-4 text-5xl font-semibold tracking-tight">${freePlan.monthlyPrice}</p>
                <p className="mt-3 text-sm text-muted-foreground">The real product, for smaller products.</p>
                <ul className="mt-7 divide-y border-y text-sm">{[`${freePlan.projectLimit} projects`, `${freePlan.feedbackMonthlyLimit} feedback each month`, 'Feedback form, inbox, and updates', 'One copy-paste install'].map((item) => <li key={item} className="py-3">{item}</li>)}</ul>
                <Link href={authHref} className="mt-8 block"><Button variant="outline" className="w-full">Start free</Button></Link>
              </div>
              <div className="border-t border-primary/20 bg-primary/[0.055] p-6 sm:p-9 md:border-l md:border-t-0">
                <div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">Pro</p><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">When things get serious</span></div>
                <p className="mt-4 text-5xl font-semibold tracking-tight">${proPlan.monthlyPrice}<span className="ml-2 text-sm font-normal text-muted-foreground">/ month</span></p>
                <p className="mt-3 text-sm text-muted-foreground">More volume, history, routing, and control.</p>
                <ul className="mt-7 divide-y border-y text-sm">{['More projects and feedback', 'Full history and delivery records', 'Multiple integrations', 'Scheduling and branding controls'].map((item) => <li key={item} className="py-3">{item}</li>)}</ul>
                <Link href={proAuthHref} className="mt-8 block"><Button className="w-full">Start with Pro</Button></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-lilac landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">The short answers.</h2><p className="mt-4 text-sm text-muted-foreground">Long answers remain available in the docs, where they belong.</p></div>
            <div className="divide-y border-y">
              {[
                ['Will it slow down my app?', 'The production widget is under 20KB gzip, loads asynchronously, and has a CI size budget.'],
                ['Can the public key read my inbox?', 'No. Publishable project keys are rejected by private REST and MCP endpoints.'],
                ['Do I reinstall after changing the form?', 'No. Save the form in the dashboard and the existing widget loads the change.'],
                ['What does the user send?', 'A short note, optional rating and screenshot, plus the page and browser context needed to understand it.'],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold">{question}<span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{answer}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta landing-reveal relative overflow-hidden px-5 py-24 sm:px-6 sm:py-32">
          <div className="landing-final-orb absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Image src="/feedbacks.dev_mascot.png" alt="feedbacks.dev mascot" width={180} height={180} className="landing-mascot-float mx-auto h-28 w-28 object-contain sm:h-36 sm:w-36" />
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Your users are already talking.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Put the conversation somewhere useful.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={authHref}><Button size="lg" className="h-12 w-full gap-2 px-7 sm:w-auto">Create a free project <ArrowRight className="h-4 w-4" /></Button></Link><Link href="/docs" prefetch={false}><Button size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">Read the docs</Button></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <BrandWordmark className="text-sm font-semibold" markClassName="h-5 w-5" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><Link href="/feedback-widget">Feedback widget</Link><Link href="/feedback-widget/nextjs">Next.js guide</Link><Link href="/canny-alternative">Canny alternative</Link><Link href="/docs" prefetch={false}>Docs</Link><Link href="/boards" prefetch={false}>Public boards</Link><Link href="/early-access">Launch notes</Link><Link href="/privacy">Privacy</Link><PrivacyChoicesButton /><Link href="/terms">Terms</Link></div>
          <a href="https://github.com/WarriorSushi/Feedbacks.dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /> Source available</a>
        </div>
      </footer>
      <a href={dashboardHref} className="sr-only">Open dashboard</a>
    </div>
  )
}
