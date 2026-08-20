import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Code2,
  Gauge,
  Image as ImageIcon,
  MousePointerClick,
  Route,
} from 'lucide-react'
import { generateInstallSnippets, PLAN_MATRIX } from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { LandingHeroDemo } from '@/components/landing-hero-demo'
import { MarketingAcquisitionShell, MarketingFinalCta } from '@/components/marketing-acquisition-shell'
import { publicEnv } from '@/lib/public-env'
import { SITE_ORIGIN } from '@/lib/site'

const authHref = `${publicEnv.NEXT_PUBLIC_APP_ORIGIN}/auth`
const canonicalPath = '/canny-alternative'
const proPlan = PLAN_MATRIX.pro
const installSnippet = generateInstallSnippets({
  projectKey: 'YOUR_PROJECT_KEY',
  appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN,
}).find((snippet) => snippet.label === 'Website')?.code || ''

export const metadata: Metadata = {
  title: 'Canny Alternative for In-Product Feedback',
  description: 'A focused Canny alternative with contextual in-product reports, a sub-20KB widget, no tracked-user pricing, and $19 monthly Pro.',
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: 'article',
    url: canonicalPath,
    title: 'Collect feedback where the problem happens',
    description: 'Compare feedbacks.dev and Canny on the four advantages that matter to a small developer-led SaaS team.',
    siteName: 'feedbacks.dev',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canny Alternative for In-Product Feedback',
    description: 'Context-rich feedback, predictable pricing, and a lightweight embed for developer-led products.',
  },
}

const advantages = [
  {
    Icon: Route,
    title: 'The report arrives ready to reproduce',
    body: 'Every submission can include its page URL, title, referrer, browser, device, viewport, language, and time zone. The user can add a visible-viewport screenshot without leaving your app.',
    proof: 'Message + technical context + optional screenshot',
  },
  {
    Icon: CircleDollarSign,
    title: 'More participation does not raise your price',
    body: `feedbacks.dev Pro is $${proPlan.monthlyPrice} per month with unlimited projects and feedback. The price is not tied to how many users post, vote, or comment.`,
    proof: `$${proPlan.monthlyPrice} monthly, no annual commitment`,
  },
  {
    Icon: Gauge,
    title: 'The widget stays deliberately small',
    body: 'The production embed is under 20KB gzip, loads asynchronously, and has a CI size budget. Your feedback tool should not become the performance problem users report.',
    proof: 'Under 20KB gzip, enforced in CI',
  },
  {
    Icon: Code2,
    title: 'Developer workflows start on Free',
    body: 'REST API, project-scoped MCP, a webhook endpoint, public boards, and Product Updates are included on Free. You can prove the full loop before paying for more capacity.',
    proof: 'API + webhooks + MCP on Free',
  },
] as const

const comparisonRows = [
  {
    label: 'Pro entry price',
    feedbacks: `$${proPlan.monthlyPrice} month to month`,
    canny: '$99 month to month, or $79/month billed annually, at 100 tracked users',
  },
  {
    label: 'What makes the price grow',
    feedbacks: 'Not user participation. Pro includes unlimited projects and feedback.',
    canny: 'Tracked-user tiers. Canny says the price automatically increases when a tier is exceeded.',
  },
  {
    label: 'Primary in-product job',
    feedbacks: 'A compact feedback form that attaches page and browser context to the report',
    canny: 'An embedded feedback board for users to post, vote, and comment',
  },
  {
    label: 'Developer access on Free',
    feedbacks: 'REST API, one webhook endpoint, and project-scoped MCP',
    canny: 'Open API on all plans; MCP connectors are listed with Pro features',
  },
] as const

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'feedbacks.dev: a focused Canny alternative for in-product feedback',
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

      <section className="landing-section landing-section-warm overflow-hidden border-b pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold text-primary">A Canny alternative for developer-led SaaS</p>
            <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[4.25rem]">
              Collect feedback where the problem happens.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              feedbacks.dev combines a lightweight in-product form with automatic technical context, optional screenshots, public boards, and developer routing. Pro is ${proPlan.monthlyPrice} a month, without tracked-user pricing.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full gap-2 px-7 sm:w-auto">
                <Link href={authHref}>Start free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">
                <Link href="#advantages">See where we win</Link>
              </Button>
            </div>
          </div>

          <dl className="mx-auto mt-10 grid max-w-5xl grid-cols-2 border-y sm:grid-cols-4">
            {[
              ['$19', 'monthly Pro'],
              ['No', 'tracked-user pricing'],
              ['<20KB', 'widget gzip'],
              ['Free', 'API, webhooks + MCP'],
            ].map(([value, label], index) => (
              <div key={label} className={`px-4 py-5 text-center ${index % 2 === 1 ? 'border-l' : ''} ${index > 1 ? 'border-t sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l' : ''}`}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mx-auto mt-12 max-w-5xl shadow-[var(--shadow-float)] sm:mt-16">
            <LandingHeroDemo installSnippet={installSnippet} />
          </div>
        </div>
      </section>

      <section id="advantages" className="landing-section landing-section-ink border-b py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-primary">Why feedbacks.dev</p>
              <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">A tighter loop from report to fix.</h2>
            </div>
            <p className="max-w-2xl self-end text-base leading-7 text-muted-foreground sm:text-lg">
              feedbacks.dev is purpose-built for one fast job: collect useful feedback inside your product, keep the technical context attached, and move important reports into the tools where developers already work.
            </p>
          </div>

          <div className="mt-12 border-y sm:mt-16">
            {advantages.map(({ Icon, title, body, proof }, index) => (
              <article key={title} className="grid gap-4 border-b py-7 last:border-0 sm:grid-cols-[56px_minmax(180px,0.65fr)_1.35fr] sm:items-start sm:gap-7 sm:py-9">
                <div className="flex items-center gap-3 sm:block">
                  <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
                  <Icon className="ml-auto h-5 w-5 text-primary sm:ml-0 sm:mt-4" />
                </div>
                <h3 className="max-w-xs text-xl font-semibold leading-7 tracking-[-0.025em]">{title}</h3>
                <div>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{body}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground"><Check className="h-4 w-4 text-primary" />{proof}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="landing-section landing-section-mint border-b py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">The focused comparison</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Four advantages you feel from the first report.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">Reviewed August 20, 2026. We compare only the areas where feedbacks.dev offers a clearer fit for small developer-led teams.</p>
            </div>
            <a href="https://canny.io/pricing" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">Verify Canny pricing</a>
          </div>

          <div className="mt-10 overflow-x-auto border-y">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="w-[22%] px-4 py-4 font-semibold">Decision point</th>
                  <th className="w-[39%] bg-primary/[0.06] px-4 py-4 font-semibold text-primary">feedbacks.dev advantage</th>
                  <th className="w-[39%] px-4 py-4 font-semibold">Canny today</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(({ label, feedbacks, canny }) => (
                  <tr key={label} className="border-b last:border-0">
                    <th scope="row" className="px-4 py-5 align-top font-medium">{label}</th>
                    <td className="bg-primary/[0.06] px-4 py-5 align-top font-medium leading-6 text-foreground"><span className="mr-2 text-primary">✓</span>{feedbacks}</td>
                    <td className="px-4 py-5 align-top leading-6 text-muted-foreground">{canny}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-sky border-b py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <MousePointerClick className="h-6 w-6 text-primary" />
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">One embed. The whole feedback loop.</h2>
            </div>
            <div className="border-y">
              {[
                [ImageIcon, 'Collect', 'A user reports the issue in your product and chooses whether to include a screenshot.'],
                [Route, 'Understand', 'The page and browser context arrive beside the message, ready for triage.'],
                [Code2, 'Route', 'Send important items to GitHub Issues, Slack, Discord, or your own webhook.'],
                [Check, 'Close the loop', 'Publish Product Updates through the same installed embed when the fix ships.'],
              ].map(([Icon, title, body], index) => {
                const StepIcon = Icon as typeof Check
                return (
                  <div key={String(title)} className="grid gap-3 border-b py-6 last:border-0 sm:grid-cols-[40px_120px_1fr] sm:items-start">
                    <StepIcon className="h-5 w-5 text-primary" />
                    <p className="font-semibold">{index + 1}. {String(title)}</p>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">{String(body)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <h2 className="text-xl font-semibold">Check every claim</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">This focused comparison is authored by feedbacks.dev. Product and pricing facts link to current public documentation.</p>
            </div>
            <div className="grid gap-x-8 text-sm sm:grid-cols-2">
              <a className="border-t py-4 font-medium hover:text-primary" href="https://canny.io/pricing" target="_blank" rel="noopener noreferrer">Canny pricing and plan features</a>
              <a className="border-t py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/9131812-canny-s-billing-plans" target="_blank" rel="noopener noreferrer">Canny billing and tracked-user tiers</a>
              <a className="border-t py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/12310827-what-is-the-sdk" target="_blank" rel="noopener noreferrer">Canny SDK and embedded board</a>
              <a className="border-t py-4 font-medium hover:text-primary" href="https://help.canny.io/en/articles/10479191-does-canny-have-an-open-api" target="_blank" rel="noopener noreferrer">Canny API availability</a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFinalCta title="Start with feedback that is ready to act on." body="Create a free project, paste one lightweight embed, and send a real report from your product. The context will arrive with it." secondaryHref="/feedback-widget" secondaryLabel="Explore the widget" />
    </MarketingAcquisitionShell>
  )
}
