import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import { PLAN_MATRIX, generateInstallSnippets } from '@feedbacks/shared'
import { LandingProductLoop } from '@/components/landing-product-loop'
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
    <div className="marketing-shell min-h-screen bg-background text-foreground">
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
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-md px-2 py-2 text-sm font-medium hover:bg-accent">Menu</summary>
              <nav className="absolute right-0 top-11 z-50 grid min-w-44 gap-1 rounded-lg border bg-popover p-2 shadow-[var(--shadow-float)]" aria-label="Mobile navigation">
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="#products">Product</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="#pricing">Pricing</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href="/docs" prefetch={false}>Docs</Link>
                <Link className="rounded-md px-3 py-2 text-sm hover:bg-accent" href={authHref}>Sign in</Link>
              </nav>
            </details>
            <Link href={authHref} className="hidden md:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href={authHref}>
              <Button size="sm" className="gap-1.5">Start free <ArrowRight className="hidden h-3.5 w-3.5 sm:block" /></Button>
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
                Put a small feedback form in your app. Capture page and browser context automatically, with an optional screenshot. Then show users the fixes you ship.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={authHref}>
                  <Button size="lg" className="h-12 w-full gap-2 px-6 sm:w-auto">Create a free project <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link href="#products"><Button variant="outline" size="lg" className="h-12 w-full bg-background/70 px-6 sm:w-auto">See how it works</Button></Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {['No card to start', 'Under 20KB gzip', 'Private feedback media'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>
                ))}
              </div>
            </div>
            <div className="min-w-0"><LandingProductLoop /></div>
          </div>
        </section>

        <section id="products" className="border-b py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mb-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold text-primary">From install to useful feedback</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl xl:text-[2.75rem] xl:leading-[1.05]">One short path to a message you can act on.</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">Create a project, paste one browser-safe snippet, and send a test. Customization and routing stay out of the way until the core loop works.</p>
            </div>
            <ol className="grid gap-4 lg:grid-cols-3">
              {[
                ['1', 'Install once', 'Choose Website, React, Next.js, or Vue and copy the visible snippet into your app shell.'],
                ['2', 'Collect useful context', 'Users write the message. Page and browser context arrive automatically; screenshots stay optional.'],
                ['3', 'Triage and close the loop', 'Prioritize the signal, route what matters, and show users the improvements you ship.'],
              ].map(([step, title, body]) => (
                <li key={step} className="min-w-0 rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{step}</span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                  {step === '1' && (
                    <pre className="mt-5 overflow-x-auto rounded-lg border bg-[oklch(var(--surface-inset))] p-3 text-xs text-foreground" aria-label="Example website install snippet">
                      <code>{installSnippet}</code>
                    </pre>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-[oklch(var(--surface-raised))] p-5">
              <p className="text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Installed code stays stable.</strong> Change the button, fields, and copy remotely after verification.</p>
              <Link href="/docs" prefetch={false}><Button variant="outline">Read the install guide</Button></Link>
            </div>
          </div>
        </section>

        <section id="setup" className="border-b bg-muted/20 py-20 sm:py-28">
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
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Designed for developer trust</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Public in the browser. Private on the server.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">The embed uses a publishable project key that cannot authorize private API access. API credentials are created separately, integration secrets are encrypted, and feedback images require an authenticated download.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/privacy"><Button variant="outline">How data is handled</Button></Link>
                <Link href="/docs/operate/security" prefetch={false}><Button variant="ghost">Security guide</Button></Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [ShieldCheck, 'Separate key types', 'Browser-safe publishable keys and scoped private API credentials have different formats and permissions.'],
                [Inbox, 'Private feedback media', 'Screenshots are sanitized, stripped of metadata, and served only after an owner check.'],
                [Bot, 'Secrets stay server-side', 'Stored integration tokens are encrypted and returned to the browser only as redacted destination hints.'],
                [MousePointer2, 'Minimal install', 'One lightweight embed, no payment script, and no private credential in customer code.'],
              ].map(([Icon, title, body]) => {
                const ItemIcon = Icon as typeof Inbox
                return <div key={String(title)} className="rounded-xl border bg-card p-5"><ItemIcon className="h-4 w-4 text-primary" /><h3 className="mt-4 text-sm font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(body)}</p></div>
              })}
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
                    <ul className="mt-6 space-y-3 text-sm">{['More projects and feedback', 'Full feedback history', 'Multiple integrations and delivery history', 'Scheduling and branding controls'].map(item => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{item}</li>)}</ul>
                    <Link href={authHref} className="mt-7 block"><Button className="w-full">Start with Pro</Button></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Before you install</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Questions developers ask first.</h2>
            </div>
            <div className="mt-10 divide-y rounded-xl border bg-card px-5 sm:px-7">
              {[
                ['Will the widget slow down my app?', 'The production widget is under 20KB gzip, loads asynchronously, and is guarded by a CI size budget.'],
                ['What data is collected automatically?', 'The current page URL and browser context can accompany feedback. Screenshot capture is optional and visible to the user.'],
                ['Can a visitor use the project key to read my inbox?', 'No. The embed key is publishable and is rejected by private REST and MCP endpoints.'],
                ['How do I handle spam?', 'Start with project- and board-scoped rate limits. Add CAPTCHA or origin restrictions only when your traffic needs them.'],
                ['Do I have to reinstall after changing the form?', 'No. The snippet stays the same; saved form and Product Update changes load remotely.'],
                ['Can I leave the Free plan?', `Yes. Free includes ${freePlan.projectLimit} projects and ${freePlan.feedbackMonthlyLimit} feedback items per month. Pro adds more capacity, history, routing, scheduling, and branding controls.`],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {question}<span aria-hidden="true" className="text-primary group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
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
          <a href="https://github.com/WarriorSushi/Feedbacks.dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /> Source available</a>
        </div>
      </footer>
      <a href={dashboardHref} className="sr-only">Open dashboard</a>
    </div>
  )
}
