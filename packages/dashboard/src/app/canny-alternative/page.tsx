import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bot, Check, CircleDollarSign, Code2, Network, Scale, ShieldCheck } from 'lucide-react'
import { PLAN_MATRIX } from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { MarketingAcquisitionShell, MarketingFinalCta } from '@/components/marketing-acquisition-shell'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'

const authHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/auth`
const canonicalPath = '/canny-alternative'
const freePlan = PLAN_MATRIX.free
const proPlan = PLAN_MATRIX.pro

export const metadata: Metadata = {
  title: 'Canny Alternative for Developer-Led SaaS Teams',
  description: 'Compare feedbacks.dev with Canny on pricing, collection, integrations, API access, MCP, public boards, and enterprise capabilities.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'article',
    url: canonicalPath,
    title: 'feedbacks.dev vs Canny: choose the system that matches your stage',
    description: 'An evidence-based comparison for developer-led products, last reviewed August 20, 2026.',
    siteName: 'feedbacks.dev',
  },
}

const comparisonRows = [
  ['Free allowance', `${freePlan.projectLimit} projects and ${freePlan.feedbackMonthlyLimit} feedback items per month`, '25 tracked users, unlimited posts and boards'],
  ['Paid entry price', `$${proPlan.monthlyPrice} per month`, '$79 per month billed yearly for Pro at 100 tracked users'],
  ['Pricing model', 'Product capacity with unlimited Pro projects and feedback', 'Tracked-user pricing that increases with participation'],
  ['In-product context', 'Page URL, browser, device, and optional visible-viewport screenshot', 'SDK identity and user or company context'],
  ['Automated feedback discovery', 'Not currently offered', 'Autopilot scans connected support, sales, review, and app sources'],
  ['Public feedback', 'Public boards, votes, replies, follows, and Product Updates', 'Feedback portals, boards, roadmaps, changelog, votes, and comments'],
  ['Developer access', 'REST API, webhooks, and project-scoped MCP on Free and Pro', 'Open API on all plans, webhooks, and MCP connectors'],
  ['Native integrations', 'Focused routing to Slack, Discord, GitHub Issues, and generic webhooks', 'Broad support, project management, CRM, auth, and messaging catalog'],
  ['Enterprise controls', 'Built for small developer-led teams today', 'Business plan adds SSO, CRM, advanced privacy, and compliance support'],
] as const

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'feedbacks.dev vs Canny: an evidence-based comparison',
  description: metadata.description,
  datePublished: '2026-08-20',
  dateModified: '2026-08-20',
  author: { '@type': 'Organization', name: 'feedbacks.dev', url: SITE_ORIGIN },
  publisher: { '@type': 'Organization', name: 'feedbacks.dev', url: SITE_ORIGIN },
  mainEntityOfPage: `${SITE_ORIGIN}${canonicalPath}`,
}

export default function CannyAlternativePage() {
  return (
    <MarketingAcquisitionShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }} />

      <section className="landing-section landing-section-warm border-b py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-end lg:gap-20">
          <div>
            <p className="mb-5 text-sm font-semibold text-primary">Canny alternative for developer-led SaaS</p>
            <h1 className="max-w-4xl text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.5rem]">Choose the feedback system that matches your stage.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Canny is a mature platform with AI feedback discovery and a broad enterprise integration catalog. feedbacks.dev is the leaner choice when you want contextual in-product reports, a direct developer workflow, and predictable entry pricing.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full gap-2 px-6 sm:w-auto"><Link href={authHref}>Try feedbacks.dev free <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full px-6 sm:w-auto"><Link href="#comparison">Compare the details</Link></Button>
            </div>
          </div>
          <aside className="border-y py-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div><p className="text-sm font-semibold">Choose feedbacks.dev when</p><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{['A developer owns setup', 'Page and browser context matter', 'You want to start at $19 monthly', 'A focused tool is easier to operate'].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul></div>
              <div><p className="text-sm font-semibold">Choose Canny when</p><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{['AI should mine many feedback sources', 'You need a broad native integration catalog', 'SSO or CRM workflows are required', 'Tracked-user pricing fits your model'].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul></div>
            </div>
          </aside>
        </div>
      </section>

      <section id="comparison" className="landing-section landing-section-mint border-b py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">At-a-glance comparison</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Reviewed August 20, 2026. Canny facts link to Canny&apos;s current public documentation so you can verify them directly.</p></div>
            <a href="https://canny.io/pricing" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">Open Canny pricing</a>
          </div>
          <div className="mt-10 overflow-x-auto border-y">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead><tr className="border-b"><th className="w-[22%] px-4 py-4 font-semibold">Decision point</th><th className="w-[39%] px-4 py-4 font-semibold text-primary">feedbacks.dev</th><th className="w-[39%] px-4 py-4 font-semibold">Canny</th></tr></thead>
              <tbody>{comparisonRows.map(([label, feedbacks, canny]) => <tr key={label} className="border-b last:border-0"><th scope="row" className="px-4 py-4 align-top font-medium">{label}</th><td className="px-4 py-4 align-top leading-6 text-foreground/80">{feedbacks}</td><td className="px-4 py-4 align-top leading-6 text-muted-foreground">{canny}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-ink border-b py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">The real tradeoff is focus versus breadth.</h2>
          <div className="mt-10 border-y">
            {[
              [Code2, 'Developer setup', 'feedbacks.dev keeps the first run to project, snippet, verification, and one test report. Canny offers more ingestion paths and operational depth.'],
              [Bot, 'AI discovery', 'Canny Autopilot is a meaningful advantage when feedback is spread across support calls, review sites, app stores, and sales tools. feedbacks.dev does not claim that capability.'],
              [Network, 'Integrations', 'Canny has the wider native catalog. feedbacks.dev deliberately starts with developer routing primitives such as GitHub Issues, webhooks, REST, and MCP.'],
              [CircleDollarSign, 'Cost shape', 'feedbacks.dev Pro is $19 monthly and does not scale by tracked users. Canny Pro begins at $79 monthly billed yearly and scales with tracked users.'],
              [ShieldCheck, 'Enterprise readiness', 'Canny is the stronger current fit for SSO, CRM, advanced portal privacy, and formal enterprise workflows.'],
            ].map(([Icon, title, body]) => {
              const RowIcon = Icon as typeof Scale
              return <article key={String(title)} className="grid gap-3 border-b py-6 last:border-0 sm:grid-cols-[44px_200px_1fr]"><RowIcon className="h-5 w-5 text-primary" /><h3 className="font-semibold">{String(title)}</h3><p className="max-w-3xl text-sm leading-6 text-muted-foreground">{String(body)}</p></article>
            })}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-sky border-b py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div><Scale className="h-5 w-5 text-primary" /><h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Our recommendation</h2></div>
          <div className="space-y-5 text-base leading-7 text-muted-foreground">
            <p>If you are an indie founder or small SaaS team and the immediate problem is collecting actionable feedback inside your own product, start with feedbacks.dev. You can install it quickly, keep technical context with the report, and upgrade only when your feedback volume and routing needs grow.</p>
            <p>If your feedback already lives across many customer systems and you need AI-assisted discovery, revenue context, SSO, CRM connections, or enterprise governance, Canny is likely the better fit today.</p>
            <p className="text-sm">This comparison is written by feedbacks.dev. We aim to describe both products fairly and update material facts when either product changes.</p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-lilac border-b py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Sources used for this comparison</h2>
          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <a className="border-y py-4 font-medium hover:text-primary" href="https://canny.io/pricing" target="_blank" rel="noopener noreferrer">Canny pricing and plan features</a>
            <a className="border-y py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/9131812-canny-s-billing-plans" target="_blank" rel="noopener noreferrer">Canny billing plans</a>
            <a className="border-y py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/10514464-what-tools-does-canny-integrate-with" target="_blank" rel="noopener noreferrer">Canny integration catalog</a>
            <a className="border-y py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/10479191-does-canny-have-an-open-api" target="_blank" rel="noopener noreferrer">Canny open API availability</a>
          </div>
        </div>
      </section>

      <MarketingFinalCta title="Start with the feedback loop you can operate today." body="Create a free feedbacks.dev project, verify the widget in your real product, and decide from direct experience." secondaryHref="/feedback-widget" secondaryLabel="Explore the widget" />
    </MarketingAcquisitionShell>
  )
}
