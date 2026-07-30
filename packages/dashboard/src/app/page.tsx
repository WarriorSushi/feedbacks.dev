import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import { PLAN_MATRIX, generateInstallSnippets } from '@feedbacks/shared'
import { LandingProductLoop } from '@/components/landing-product-loop'
import { LandingFeedbackStory } from '@/components/landing-feedback-story'
import { LandingInstallStory } from '@/components/landing-install-story'
import { LandingConnectionsStory } from '@/components/landing-connections-story'
import { LandingScrollHeader } from '@/components/landing-scroll-header'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'
import {
  ArrowRight,
  Bot,
  Check,
  Github,
  Inbox,
  MousePointer2,
  ShieldCheck,
} from 'lucide-react'
import { WidgetDemo } from './widget-demo-client'
import { AuthenticatedRedirect } from './authenticated-redirect'

const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
const authHref = `${appOrigin}/auth`
const dashboardHref = `${appOrigin}/dashboard`

const installSnippet = generateInstallSnippets({
  projectKey: 'your-project-key',
  appOrigin,
}).find((snippet) => snippet.label === 'Website')?.code || ''

const freePlan = PLAN_MATRIX.free
const proPlan = PLAN_MATRIX.pro

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_ORIGIN,
    siteName: 'feedbacks.dev',
    title: 'feedbacks.dev | Feedback forms and product updates',
    description: 'Collect useful in-product feedback, triage it quickly, and show users what shipped with one lightweight embed.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'feedbacks.dev | Feedback forms and product updates',
    description: 'Collect useful in-product feedback, triage it quickly, and show users what shipped with one lightweight embed.',
  },
}

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'feedbacks.dev',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: SITE_ORIGIN,
  description: 'Collect in-product feedback and publish product updates with one lightweight embed.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: freePlan.monthlyPrice,
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: proPlan.monthlyPrice,
      priceCurrency: 'USD',
    },
  ],
  featureList: [
    'In-product feedback form',
    'Feedback inbox and triage',
    'Product updates',
    'Public feedback boards',
    'Slack, Discord, GitHub, and webhook integrations',
    'REST API and MCP server',
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <AuthenticatedRedirect appOrigin={appOrigin} />
      <LandingScrollHeader>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="font-semibold transition-opacity hover:opacity-80">
            <BrandWordmark className="text-lg" priority />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <Link href="#products"><Button variant="ghost" size="sm">Products</Button></Link>
            <Link href="#setup"><Button variant="ghost" size="sm">How it works</Button></Link>
            <Link href="#pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/docs" prefetch={false}><Button variant="ghost" size="sm">Docs</Button></Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href={authHref} className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href={authHref}>
              <Button size="sm" className="gap-1.5">Start free <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      </LandingScrollHeader>

      <main>
        <section className="landing-hero relative overflow-hidden border-b">
          <div className="landing-hero-grain absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 xl:grid-cols-[minmax(540px,0.88fr)_minmax(0,1.12fr)] xl:items-center xl:gap-12 xl:pb-24 xl:pt-24">
            <div className="lg:pb-6">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/70"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Feedback and updates inside your app</p>
              <h1 className="mt-5 max-w-2xl text-[2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4rem] xl:text-[3.55rem] 2xl:text-[3.85rem]">
                <span className="block xl:whitespace-nowrap">Find what users need.</span>
                <span className="mt-1 block xl:whitespace-nowrap">Show what you fixed.</span>
              </h1>
              <p className="mt-6 max-w-[590px] text-base leading-7 text-muted-foreground sm:text-lg">
                Put a small feedback form in your app. Get the page and screenshot with each message. Then show users the fixes you ship.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={authHref}>
                  <Button size="lg" className="h-12 w-full gap-2 px-6 sm:w-auto">Create a free project <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link href="#products"><Button variant="outline" size="lg" className="h-12 w-full bg-background/70 px-6 sm:w-auto">See how it works</Button></Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {['Free to start', 'One code block', 'Change it without new code'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>
                ))}
              </div>
            </div>
            <div className="min-w-0"><LandingProductLoop /></div>
          </div>
        </section>

        <section id="products" className="border-b py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-0 sm:px-6">
            <div className="mb-12 grid gap-6 px-5 sm:px-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold text-primary">A clear path from problem to fix</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl xl:text-[2.75rem] xl:leading-[1.05]"><span className="block xl:whitespace-nowrap">Users speak. You fix it.</span><span className="mt-1 block xl:whitespace-nowrap">They see the change.</span></h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">Users send a bug or idea from your app. Your team gets the details it needs. When you ship a fix, users see a clear “What changed” message inside your app.</p>
            </div>
            <LandingFeedbackStory />
          </div>
        </section>

        <section id="setup" className="border-b bg-muted/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-0 sm:px-6">
            <div className="mb-12 grid gap-6 px-5 sm:px-0 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold text-primary">Set up once</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl xl:text-[2.75rem] xl:leading-[1.05]"><span className="block">Make the form yours.</span><span className="mt-1 block">Paste one code block.</span></h2>
              </div>
              <p className="max-w-2xl leading-7 text-muted-foreground lg:justify-self-end">Choose the words, fields, and color. Paste the code into your site. Send one test. Later changes show up on their own, so you do not paste code again.</p>
            </div>
            <LandingInstallStory snippet={installSnippet} />
          </div>
        </section>

        <section className="border-b bg-muted/20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-0 sm:px-6">
            <div className="mb-12 grid gap-6 px-5 sm:px-0 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold text-primary">After feedback reaches the inbox</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl xl:text-[2.75rem] xl:leading-[1.05]">Turn a user message into work your team can finish.</h2>
              </div>
              <p className="max-w-2xl leading-7 text-muted-foreground lg:justify-self-end">Send the right feedback to Slack, Discord, GitHub, or any webhook. Let trusted coding agents read and submit feedback through REST or MCP. Give users a public page for ideas, votes, and replies.</p>
            </div>
            <LandingConnectionsStory />
          </div>
        </section>

        <section className="border-b py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-xl border bg-muted/25 p-8">
              <div className="absolute inset-0 bg-grid-pattern opacity-35" />
              <div className="relative"><WidgetDemo /></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Short for users. Useful for your team.</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Ask one clear question. Get the details for free.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">Users write what went wrong. feedbacks.dev can add the page, browser, rating, and screenshot. Your team spends less time asking follow-up questions.</p>
              <div className="mt-8 space-y-4">
                {[
                  [MousePointer2, 'Change it any time', 'Edit the button, place, words, fields, and color without replacing the code.'],
                  [Inbox, 'See what needs work', 'Search, sort, tag, and move each message through a simple inbox.'],
                  [Bot, 'Send work to your tools', 'Pass a clear task to your coding agent or team without sharing private keys.'],
                  [ShieldCheck, 'Safe to paste', 'The website code uses a public project key. Private keys stay on the server.'],
                ].map(([Icon, title, body]) => {
                  const ItemIcon = Icon as typeof Inbox
                  return <div key={String(title)} className="flex gap-4"><ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><h3 className="text-sm font-semibold">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{String(body)}</p></div></div>
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b bg-muted/20 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Simple pricing</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Start free. Pay when you grow.</h2><p className="mt-5 leading-7 text-muted-foreground">The feedback form, messages for users, setup, and inbox are ready from day one.</p></div>
              <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
                <div className="grid md:grid-cols-2">
                  <div className="p-6 sm:p-8">
                    <p className="text-sm font-semibold">Free</p><p className="mt-3 text-4xl font-semibold tracking-tight">${freePlan.monthlyPrice}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                    <p className="mt-2 text-sm text-muted-foreground">For one or two products getting started.</p>
                    <ul className="mt-6 space-y-3 text-sm">{[`${freePlan.projectLimit} projects`, `${freePlan.feedbackMonthlyLimit} feedback / month`, 'Feedback form + messages for users', 'One code block'].map(item => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{item}</li>)}</ul>
                    <Link href={authHref} className="mt-7 block"><Button variant="outline" className="w-full">Start free</Button></Link>
                  </div>
                  <div className="border-t border-primary/20 bg-primary/[0.045] p-6 sm:p-8 md:border-l md:border-t-0">
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold">Pro</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Full product</span></div>
                    <p className="mt-3 text-4xl font-semibold tracking-tight">${proPlan.monthlyPrice}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                    <p className="mt-2 text-sm text-muted-foreground">For teams that get more feedback each week.</p>
                    <ul className="mt-6 space-y-3 text-sm">{[proPlan.projectLimit ? `${proPlan.projectLimit} projects` : 'Unlimited projects', 'Unlimited feedback history', 'Integrations, boards, API and MCP', 'Priority support'].map(item => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{item}</li>)}</ul>
                    <Link href={authHref} className="mt-7 block"><Button className="w-full">Start with Pro</Button></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ready when you are</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Hear your users today.</h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">Create a project, paste one safe code block, and send a test. We guide you through each step.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={authHref}><Button size="lg" className="h-12 w-full gap-2 px-7 sm:w-auto">Create a free project <ArrowRight className="h-4 w-4" /></Button></Link><Link href="/docs" prefetch={false}><Button size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">Read the docs</Button></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <BrandWordmark className="text-sm font-semibold" markClassName="h-5 w-5" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><Link href="/docs" prefetch={false}>Docs</Link><Link href="/boards" prefetch={false}>Public boards</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <a href="https://github.com/WarriorSushi/feedbacks.dev-2026" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /> Source available</a>
        </div>
      </footer>
      <a href={dashboardHref} className="sr-only">Open dashboard</a>
    </div>
  )
}
