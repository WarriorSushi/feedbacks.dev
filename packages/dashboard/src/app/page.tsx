import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Gauge, Gift, Github, HeartHandshake, LockKeyhole, MessageSquareText, Route } from 'lucide-react'
import { PLAN_MATRIX, generateInstallSnippets } from '@feedbacks/shared'
import { AuthenticatedRedirect } from './authenticated-redirect'
import { BrandWordmark } from '@/components/brand-wordmark'
import { LandingProductStories } from '@/components/landing-product-stories'
import { LandingMobileMenu } from '@/components/landing-mobile-menu'
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
  { Icon: Gauge, value: 'Under 20KB', label: 'The production widget has a CI-enforced gzip budget.' },
  { Icon: LockKeyhole, value: 'Browser-safe', label: 'The public project key cannot read your private inbox.' },
  { Icon: Route, value: 'One feedback loop', label: 'Collect, triage, route, and publish updates from one place.' },
] as const

export default function LandingPage() {
  return (
    <div className="marketing-shell min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, '\\u003c') }} />
      <AuthenticatedRedirect appOrigin={appOrigin} />

      <LandingScrollHeader>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="inline-flex min-h-10 items-center font-semibold transition-opacity hover:opacity-80" aria-label="feedbacks.dev home"><BrandWordmark className="text-lg" textClassName="hidden sm:inline" priority /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <Link href="#product"><Button variant="ghost" size="sm">Product</Button></Link>
            <Link href="#setup"><Button variant="ghost" size="sm">Install</Button></Link>
            <Link href="#pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/docs" prefetch={false}><Button variant="ghost" size="sm">Docs</Button></Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle landing />
            <LandingMobileMenu authHref={authHref} />
            <Link href={authHref} className="hidden lg:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href={authHref}><Button size="sm" className="h-10 gap-1 px-3 lg:h-9">Start <span className="hidden min-[360px]:inline">free</span><ArrowRight className="hidden h-3.5 w-3.5 sm:block" /></Button></Link>
          </div>
        </div>
      </LandingScrollHeader>

      <main>
        <LandingSectionObserver />
        <LandingTryWidgetHero />

        <LandingProductStories />

        <section id="setup" className="landing-setup-section landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">From zero to a real report</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Install it before your coffee gets cold.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Create a project, copy the exact snippet, and send one test message from your own page. Advanced customization can wait until the feedback is already flowing.</p>
            </div>
            <LandingVibeInstall snippet={installSnippet} />
          </div>
        </section>

        <section className="landing-proof-strip landing-reveal border-b py-6 sm:py-8">
          <div className="mx-auto grid max-w-7xl gap-3 px-5 sm:px-6 md:grid-cols-3">
            {proofPoints.map(({ Icon, value, label }) => (
              <div key={value} className="flex items-start gap-4 rounded-xl border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></span>
                <div><p className="text-sm font-semibold">{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="landing-pricing-section landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold"><Gift className="h-4 w-4 text-primary" />A genuinely useful Free plan</div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Use the full feedback loop for free.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">No trial clock and no card. Upgrade when more projects, more history, and more volume are worth paying for.</p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-[1.06fr_0.94fr]">
              <article className="landing-free-plan relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-9">
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-2 text-[10px] font-bold text-primary-foreground">START HERE</div>
                <p className="text-sm font-semibold">Free forever</p>
                <div className="mt-5 flex items-end gap-2"><p className="text-6xl font-semibold tracking-[-0.06em]">${freePlan.monthlyPrice}</p><span className="pb-2 text-sm text-muted-foreground">no card needed</span></div>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">For side projects, launches, and growing products that want the real system, not a stripped demo.</p>
                <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
                  {[`${freePlan.projectLimit} projects`, `${freePlan.feedbackMonthlyLimit} feedback / month`, `${freePlan.historyDays} days of history`, 'Feedback form + inbox', 'Public board + product updates', 'REST API + MCP + 1 webhook'].map((item) => <li key={item} className="flex items-start gap-2 rounded-lg bg-muted/35 p-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
                <Link href={authHref} className="mt-8 block"><Button className="h-12 w-full gap-2 text-sm">Create a free project <ArrowRight className="h-4 w-4" /></Button></Link>
              </article>

              <article className="landing-pro-plan relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e0b] p-6 text-zinc-100 shadow-[0_34px_100px_-55px_rgb(0_0_0/0.9)] sm:p-9">
                <div className="landing-pro-glow absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-300/20 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <p className="text-sm font-semibold text-lime-300">Pro, when you need it</p>
                  <div className="mt-5 flex items-end gap-2"><p className="text-6xl font-semibold tracking-[-0.06em]">${proPlan.monthlyPrice}</p><span className="pb-2 text-sm text-zinc-500">/ month</span></div>
                  <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">For products with steady feedback, longer memory, and more destinations. Cancel without losing your work.</p>
                  <ul className="mt-8 space-y-3 text-sm">
                    {['Unlimited projects and feedback', 'Full feedback history', 'Unlimited webhook destinations', 'Scheduling and 90-day update analytics', 'Custom branding controls'].map((item) => <li key={item} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0"><Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />{item}</li>)}
                  </ul>
                  <Link href={proAuthHref} className="mt-8 block"><Button className="h-12 w-full bg-lime-300 text-sm text-zinc-950 hover:bg-lime-200">Choose Pro</Button></Link>
                  <p className="mt-4 text-center text-[10px] text-zinc-500">The Free plan stays available if you downgrade.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-faq-section landing-reveal border-b py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Straight answers</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">The things developers ask first.</h2></div>
            <div className="mt-12 grid gap-3 md:grid-cols-2">
              {[
                ['Will it slow down my app?', 'The production widget is under 20KB gzip, loads asynchronously, and has a CI size budget.'],
                ['Can the public key read my inbox?', 'No. Publishable project keys are rejected by private REST and MCP endpoints.'],
                ['Do I reinstall after changing the form?', 'No. Save the form in the dashboard and the existing widget loads the change.'],
                ['What does the user send?', 'A short note, optional rating and screenshot, plus the page and browser context needed to understand it.'],
              ].map(([question, answer]) => (
                <details key={question} className="group rounded-xl border bg-card px-5 py-2"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-3 text-sm font-semibold">{question}<span aria-hidden="true" className="text-lg text-primary transition-transform group-open:rotate-45">+</span></summary><p className="mb-4 max-w-2xl text-sm leading-6 text-muted-foreground">{answer}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta landing-reveal relative overflow-hidden px-5 py-24 sm:px-6 sm:py-32">
          <div className="landing-final-orb absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="landing-final-chip landing-final-chip-left absolute left-[8%] top-[25%] hidden rotate-[-5deg] items-center gap-2 rounded-xl border bg-card px-4 py-3 text-xs shadow-lg lg:flex"><MessageSquareText className="h-4 w-4 text-primary" />New feedback · just now</div>
          <div className="landing-final-chip landing-final-chip-right absolute bottom-[24%] right-[8%] hidden rotate-[4deg] items-center gap-2 rounded-xl border bg-card px-4 py-3 text-xs shadow-lg lg:flex"><Check className="h-4 w-4 text-primary" />Routed to GitHub #184</div>
          <div className="relative mx-auto max-w-4xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm"><HeartHandshake className="h-6 w-6 text-primary" /></span>
            <h2 className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Your first useful report could arrive today.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Start with the generous plan. Keep the context. Ship the fix. Tell the people who asked.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={authHref}><Button size="lg" className="h-12 w-full gap-2 px-7 sm:w-auto">Create a free project <ArrowRight className="h-4 w-4" /></Button></Link><Link href="/docs" prefetch={false}><Button size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">Read the docs</Button></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <BrandWordmark className="text-sm font-semibold" markClassName="h-5 w-5" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><Link href="/feedback-widget">Feedback widget</Link><Link href="/feedback-widget/nextjs">Next.js guide</Link><Link href="/docs" prefetch={false}>Docs</Link><Link href="/boards" prefetch={false}>Public boards</Link><Link href="/early-access">Launch notes</Link><Link href="/privacy">Privacy</Link><PrivacyChoicesButton /><Link href="/terms">Terms</Link></div>
          <a href="https://github.com/WarriorSushi/Feedbacks.dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /> Source available</a>
        </div>
      </footer>
      <a href={dashboardHref} className="sr-only">Open dashboard</a>
    </div>
  )
}
