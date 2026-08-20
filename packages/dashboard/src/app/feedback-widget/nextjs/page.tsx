import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCode2, RefreshCw, TestTube2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingAcquisitionShell, MarketingCodeBlock, MarketingFinalCta } from '@/components/marketing-acquisition-shell'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'

const authHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/auth`
const canonicalPath = '/feedback-widget/nextjs'
const nextLayoutCode = `import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div data-feedbacks-host="YOUR_PROJECT_KEY" />
        <Script
          src="https://app.feedbacks.dev/widget/latest.js"
          data-project="YOUR_PROJECT_KEY"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`

export const metadata: Metadata = {
  title: 'Add a Feedback Widget to Next.js',
  description: 'Install a contextual feedback widget once in the Next.js App Router root layout, verify it, and configure it remotely without future redeploys.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'article',
    url: canonicalPath,
    title: 'Add a feedback widget to Next.js without rebuilding it later',
    description: 'A practical App Router installation with one stable script and a browser-safe project key.',
    siteName: 'feedbacks.dev',
  },
}

const steps = [
  ['Create one project', 'Name the app, then open its Install workspace. The dashboard generates the browser-safe project key and exact snippet.'],
  ['Add it to the root layout', 'Place the host element and script after your application content so one widget instance survives route changes.'],
  ['Run hosted verification', 'Confirm the saved form and project key work before debugging your own application shell.'],
  ['Send a test from the real app', 'Open a route you recognize, submit a message, and check that the URL and browser context reach the correct inbox.'],
  ['Configure remotely', 'Change fields, placement, labels, colors, screenshots, attachments, and Product Updates from the dashboard.'],
]

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Add a feedback widget to a Next.js App Router application',
  description: metadata.description,
  url: `${SITE_ORIGIN}${canonicalPath}`,
  dateModified: '2026-08-20',
  totalTime: 'PT10M',
  step: steps.map(([name, text], index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name,
    text,
    url: `${SITE_ORIGIN}${canonicalPath}#step-${index + 1}`,
  })),
}

export default function NextjsFeedbackWidgetPage() {
  return (
    <MarketingAcquisitionShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd).replace(/</g, '\\u003c') }} />

      <section className="landing-section landing-section-warm border-b py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
          <div>
            <p className="mb-5 text-sm font-semibold text-primary">Next.js App Router guide</p>
            <h1 className="max-w-3xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.4rem]">Install once. Keep it through every route change.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Put the feedbacks.dev script in the root layout, verify one real submission, then manage the form from the dashboard instead of shipping configuration in application code.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full gap-2 px-6 sm:w-auto"><Link href={authHref}>Create a free project <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full px-6 sm:w-auto"><Link href="#code">Jump to the code</Link></Button>
            </div>
          </div>
          <div id="code"><MarketingCodeBlock label="app/layout.tsx" code={nextLayoutCode} /></div>
        </div>
      </section>

      <section className="landing-section landing-section-mint border-b py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Five steps from empty account to verified report.</h2>
          <ol className="mt-10 border-y">
            {steps.map(([title, body], index) => (
              <li key={title} id={`step-${index + 1}`} className="grid scroll-mt-24 gap-3 border-b py-6 last:border-0 sm:grid-cols-[54px_220px_1fr]">
                <span className="font-mono text-xs text-primary">0{index + 1}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section-ink border-b py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <RefreshCw className="h-5 w-5 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Why the root layout is the right boundary.</h2>
          </div>
          <div className="divide-y border-y">
            {[
              [FileCode2, 'One runtime instance', 'The root layout persists while App Router pages change, preventing duplicate widget controllers.'],
              [TestTube2, 'A clean verification path', 'Hosted verification separates project configuration problems from host application problems.'],
              [CheckCircle2, 'Remote form changes', 'Saved dashboard configuration reaches the installed widget without changing layout.tsx.'],
            ].map(([Icon, title, body]) => {
              const RowIcon = Icon as typeof FileCode2
              return <article key={String(title)} className="grid gap-3 py-6 sm:grid-cols-[44px_190px_1fr]"><RowIcon className="h-5 w-5 text-primary" /><h3 className="font-semibold">{String(title)}</h3><p className="text-sm leading-6 text-muted-foreground">{String(body)}</p></article>
            })}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-sky border-b py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Avoid the common install mistakes.</h2>
          </div>
          <div className="border-y">
            {[
              ['Do not use the private API key', 'Browser code receives the publishable project key generated by the Install workspace. Keep REST and MCP credentials server-side.'],
              ['Do not mount it on every page', 'A page component can remount during navigation and create duplicate triggers. Use the root layout.'],
              ['Do not customize before the first test', 'Verify the default form from the real application first. Add origin restrictions, CAPTCHA, and custom triggers afterward.'],
              ['Do not load two installation methods', 'Choose the Website script or the React wrapper, not both in the same application shell.'],
            ].map(([title, body]) => <article key={title} className="grid gap-2 border-b py-5 last:border-0 sm:grid-cols-[220px_1fr]"><h3 className="text-sm font-semibold">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-lilac border-b py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><h2 className="text-3xl font-semibold tracking-[-0.04em]">Need another framework?</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">The framework documentation also covers React, Vue, WordPress, static HTML, shared templates, and tag managers.</p></div>
            <div className="flex flex-wrap gap-3"><Button asChild><Link href="/docs/install/frameworks" prefetch={false}>Read framework docs</Link></Button><Button asChild variant="outline"><Link href="/feedback-widget">Explore the widget</Link></Button></div>
          </div>
        </div>
      </section>

      <MarketingFinalCta title="Add feedback before the next bug report arrives." body="Install the generated project snippet in your root layout and verify one message from a real route." secondaryHref="/docs/install/verify" secondaryLabel="Verification guide" />
    </MarketingAcquisitionShell>
  )
}
