import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Code2, Image as ImageIcon, MonitorSmartphone, Route, ShieldCheck } from 'lucide-react'
import { generateInstallSnippets } from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { LandingHeroDemo } from '@/components/landing-hero-demo'
import { MarketingAcquisitionShell, MarketingCodeBlock, MarketingFinalCta } from '@/components/marketing-acquisition-shell'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'

const authHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/auth`
const canonicalPath = '/feedback-widget'
const installSnippet = generateInstallSnippets({
  projectKey: 'YOUR_PROJECT_KEY',
  appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN,
}).find((snippet) => snippet.label === 'Website')?.code || ''

export const metadata: Metadata = {
  title: 'Feedback Widget for SaaS and Web Apps',
  description: 'Add a lightweight feedback widget that captures the page, browser, device, and optional screenshot with every useful report.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'website',
    url: canonicalPath,
    title: 'A feedback widget that arrives with the page attached',
    description: 'Collect contextual in-product feedback, triage it, and close the loop with one lightweight embed.',
    siteName: 'feedbacks.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Feedback Widget for SaaS and Web Apps',
    description: 'Collect contextual in-product feedback with one lightweight embed.',
  },
}

const faq = [
  ['What does the feedback widget capture?', 'The widget can attach the current page URL and browser context. Screenshot and file attachment controls are optional and visible to the person submitting feedback.'],
  ['Will it slow down my application?', 'The production widget is under 20KB gzip, loads asynchronously, and has a CI size budget that prevents accidental growth.'],
  ['Do I need to redeploy after changing the form?', 'No. Placement, fields, labels, colors, screenshots, attachments, and Product Updates are saved remotely. The installed snippet stays stable.'],
  ['Can the browser project key read my inbox?', 'No. The publishable project key is accepted by browser submission surfaces and rejected by private REST and MCP endpoints.'],
  ['Can I use my own feedback button?', 'Yes. Choose the custom trigger mode and connect your existing button with the supported data attribute or selector.'],
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'feedbacks.dev feedback widget',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: `${SITE_ORIGIN}${canonicalPath}`,
    description: metadata.description,
    offers: [
      { '@type': 'Offer', name: 'Free', price: 0, priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: 19, priceCurrency: 'USD' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  },
]

export default function FeedbackWidgetPage() {
  return (
    <MarketingAcquisitionShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <section className="landing-hero relative overflow-hidden border-b">
        <div className="landing-hero-grain pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1600px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 2xl:grid-cols-[minmax(620px,0.9fr)_minmax(0,1.1fr)] 2xl:items-center 2xl:pb-24 2xl:pt-24">
          <div className="min-w-0">
            <p className="mb-5 text-sm font-semibold text-primary">Feedback widget for developer-led products</p>
            <h1 className="max-w-3xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.5rem] 2xl:text-[4rem]">
              A feedback widget that arrives with the page attached.
            </h1>
            <p className="mt-6 max-w-[650px] text-base leading-7 text-muted-foreground sm:text-lg">
              Users write the short version. feedbacks.dev adds the page, browser, device, and optional screenshot so your team can act without another round of questions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full gap-2 px-6 sm:w-auto"><Link href={authHref}>Create a free project <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-12 w-full px-6 sm:w-auto"><Link href="#install">See the install</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {['Free for 2 projects', '500 feedback items monthly', 'Under 20KB gzip'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>)}
            </div>
          </div>
          <div className="min-w-0"><LandingHeroDemo installSnippet={installSnippet} /></div>
        </div>
      </section>

      <section className="landing-section landing-section-mint border-b py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">A short message becomes a useful report.</h2>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Keep the form easy for users while collecting the technical context developers repeatedly ask for.</p>
            </div>
            <div className="divide-y border-y">
              {[
                [Route, 'Page context', 'Know the exact URL where the user opened the form.'],
                [MonitorSmartphone, 'Browser and device', 'See the environment without asking the user to identify it.'],
                [ImageIcon, 'Optional screenshot', 'Capture the visible viewport only when the user chooses to include it.'],
                [ShieldCheck, 'Separate browser key', 'The public embed credential cannot read private feedback or integrations.'],
              ].map(([Icon, title, body]) => {
                const RowIcon = Icon as typeof Route
                return <article key={String(title)} className="grid gap-3 py-6 sm:grid-cols-[44px_180px_1fr] sm:items-start"><RowIcon className="h-5 w-5 text-primary" /><h3 className="text-sm font-semibold">{String(title)}</h3><p className="text-sm leading-6 text-muted-foreground">{String(body)}</p></article>
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="install" className="landing-section landing-section-ink border-b py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Paste it once. Configure it remotely.</h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Create a project, copy the generated Website snippet, and place it in the shared shell of your application. Send one test before changing anything else.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild><Link href="/feedback-widget/nextjs">Next.js installation <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline"><Link href="/docs/install/frameworks" prefetch={false}>All frameworks</Link></Button>
            </div>
          </div>
          <MarketingCodeBlock label="Website embed" code={installSnippet} />
        </div>
      </section>

      <section className="landing-section landing-section-sky border-b py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">The feedback loop stays in one product.</h2>
          <div className="mt-10 border-y">
            {[
              ['01', 'Collect', 'A user opens the widget from the page where the issue happened.'],
              ['02', 'Triage', 'Read the message with its page and environment, then set priority, status, tags, and notes.'],
              ['03', 'Route', 'Forward the important items to Slack, Discord, GitHub Issues, a webhook, REST, or MCP.'],
              ['04', 'Close the loop', 'Publish a Product Update or share selected requests on a public feedback board.'],
            ].map(([number, title, body]) => <article key={number} className="grid gap-3 border-b py-6 last:border-0 sm:grid-cols-[54px_180px_1fr]"><span className="font-mono text-xs text-primary">{number}</span><h3 className="font-semibold">{title}</h3><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-warm border-b py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Before you install</h2>
          <div className="mt-10 divide-y border-y">
            {faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{question}<span aria-hidden="true" className="text-primary group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <MarketingFinalCta title="Give users one place to explain what happened." body="Create a project, paste the generated snippet, and confirm your first contextual report in the inbox." />
    </MarketingAcquisitionShell>
  )
}
