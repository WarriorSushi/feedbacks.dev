import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateInstallSnippets } from '@feedbacks/shared'
import { CodeSnippet } from '@/components/code-snippet'
import { publicEnv } from '@/lib/public-env'
import {
  ArrowRight,
  Check,
  Github,
  Zap,
  Bot,
  ThumbsUp,
  MessageSquare,
  Shield,
  Sparkles,
} from 'lucide-react'
import { WidgetDemo, ScrollHeader } from './widget-demo-client'

// ─── Code snippets ────────────────────────────────────────────────────────────

const installSnippet = generateInstallSnippets({
  projectKey: 'your-project-key',
  appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN,
}).find((snippet) => snippet.label === 'Website')?.code || ''

const mcpSnippet = `// ~/.claude/claude_desktop_config.json
{
  "mcpServers": {
    "feedbacks": {
      "command": "npx",
      "args": ["-y", "@feedbacks/mcp-server"],
      "env": {
        "FEEDBACKS_API_KEY": "fb_live_..."
      }
    }
  }
}`

const apiSnippet = `# List recent feedback
curl https://feedbacks.dev/api/v1/feedback \\
  -H "X-API-Key: fb_live_..." \\
  | jq '.feedback[] | {type, message}'

# Result
# { "type": "bug",  "message": "CSV export crashes on large sets" }
# { "type": "idea", "message": "Add keyboard shortcuts please"   }`

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <ScrollHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            feedbacks
            <span className="text-primary">.dev</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/boards">
              <Button variant="ghost" size="sm">
                Boards
              </Button>
            </Link>
            <a
              href="https://github.com/syedirfan/feedbacks.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <Github className="h-4 w-4" />
              Open source
            </a>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            <Link href="/auth">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="font-semibold">
                Start free
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </ScrollHeader>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        {/* Atmospheric gradient backdrop */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-background" />
          <div
            className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -right-1/4 top-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: 'radial-gradient(circle, hsl(280 60% 60%) 0%, transparent 70%)' }}
          />
        </div>
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-14 md:flex-row md:items-center md:gap-12 lg:gap-20">
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  Open source &middot; MIT
                </Badge>
              </div>

              <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tighter md:text-6xl lg:text-7xl">
                Install feedback
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  in minutes.
                </span>
                <br />
                Triage it in one inbox.
              </h1>

              <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                Start with one clean snippet, verify the widget, and collect useful context
                automatically. Public boards stay available as a deliberate wedge when sharing
                the workflow openly helps.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth">
                  <Button size="lg" className="group h-12 px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="#install">
                  <Button variant="outline" size="lg" className="h-12 gap-2 font-semibold">
                    See install
                  </Button>
                </Link>
                <Link href="/boards">
                  <Button variant="outline" size="lg" className="h-12 font-semibold">
                    Browse boards
                  </Button>
                </Link>
                <a
                  href="https://github.com/syedirfan/feedbacks.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="lg" className="h-12 gap-2 font-semibold">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  { Icon: Zap, label: 'Verified install first' },
                  { Icon: Bot, label: 'Triage in one inbox' },
                  { Icon: ThumbsUp, label: 'Public boards when useful' },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-shrink-0 justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -inset-10 rounded-3xl bg-primary/8 blur-3xl" />
                <div className="relative">
                  <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Live preview
                  </p>
                  <WidgetDemo />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Install strip ────────────────────────────────────────────────────── */}
      <section id="install" className="border-b bg-zinc-950 px-6 py-16 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-2xl">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Install
          </p>
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-50">
            One script tag. Clear defaults. Verified fast.
          </h2>
          <CodeSnippet tabs={[{ label: 'HTML', code: installSnippet, language: 'html' }]} />
        </div>
      </section>

      {/* ── Three differentiators ───────────────────────────────────────────── */}
      <section className="relative border-b py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
            {[
              {
                Icon: Zap,
                headline: 'Install trust',
                sub: 'Copy-paste confidence',
                body: 'One snippet, clear defaults, and a hosted verification loop so teams can trust the install before they touch advanced settings.',
              },
              {
                Icon: Bot,
                headline: 'Fast triage',
                sub: 'Inbox and routing',
                body: 'Feedback lands with context already attached, then moves into one inbox where small teams can review and route issues quickly.',
              },
              {
                Icon: ThumbsUp,
                headline: 'Public boards',
                sub: 'Deliberate wedge',
                body: 'Publish a board only when public visibility helps. It stays secondary to install and triage, not a bloated setup surface.',
              },
            ].map(({ Icon, headline, sub, body }) => (
              <div key={headline} className="bg-card p-8 md:p-10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {sub}
                </p>
                <h3 className="mb-3 text-2xl font-black tracking-tight">{headline}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Agent API ─────────────────────────────────────────────────────── */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
            <div className="flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Optional automation
              </p>
              <h2 className="mb-5 text-4xl font-black leading-tight tracking-tighter md:text-5xl">
                Route feedback into
                <br />
                your actual workflow.
              </h2>
              <p className="mb-8 max-w-sm leading-relaxed text-muted-foreground">
                Start with the widget, verification, and inbox. Connect the API or MCP server
                when you want automation, not before the install feels solid.
              </p>
              <ul className="space-y-3">
                {[
                  'Full REST API for custom routing and automation',
                  'Native MCP server for Claude Code, Cursor, and other agents',
                  'API key auth with no OAuth setup',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1">
              <CodeSnippet
                tabs={[
                  { label: 'MCP Config', code: mcpSnippet, language: 'json' },
                  { label: 'REST API', code: apiSnippet, language: 'bash' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Getting started
          </p>
          <h2 className="mb-14 text-4xl font-black tracking-tighter md:text-5xl">
            Install, verify, then triage.
          </h2>
          <div className="divide-y">
            {[
              {
                num: '01',
                title: 'Paste the script tag',
                body: 'Add one line to your HTML. Works with any framework and keeps the first step simple enough to trust quickly.',
              },
              {
                num: '02',
                title: 'Verify the widget and collect context',
                body: 'Confirm the install, then capture URL, browser context, optional rating, screenshot, and email so the inbox starts with signal instead of guesswork.',
              },
              {
                num: '03',
                title: 'Triage quickly and route what matters',
                body: 'Review feedback in the inbox, then push important issues into Slack, Discord, your own webhooks, or agent workflows when needed.',
              },
            ].map(({ num, title, body }) => (
              <div
                key={num}
                className="flex flex-col gap-4 py-8 md:flex-row md:items-baseline md:gap-12"
              >
                <span className="text-5xl font-black tracking-tighter text-primary/15 md:w-20 md:flex-shrink-0 md:text-right">
                  {num}
                </span>
                <div>
                  <h3 className="mb-1.5 text-xl font-bold tracking-tight">{title}</h3>
                  <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why feedbacks.dev ─────────────────────────────────────────────────── */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Why us
          </p>
          <h2 className="mb-14 text-4xl font-black tracking-tighter md:text-5xl">
            Clarity beats novelty.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: Shield,
                title: 'Verified install',
                desc: 'No fake setup states. The first-run path is built to prove the widget works before you move on.',
              },
              {
                Icon: MessageSquare,
                title: 'Real-time inbox',
                desc: 'See feedback the moment it arrives. Filter, tag, and respond without delay.',
              },
              {
                Icon: Sparkles,
                title: 'Public boards only when useful',
                desc: 'Boards are available, but they stay secondary to the install and triage workflow.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border bg-card/50 p-6 transition-all duration-200 hover:bg-card hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b bg-muted/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </p>
          <h2 className="mb-2 text-4xl font-black tracking-tighter md:text-5xl">
            Simple, honest.
          </h2>
          <p className="mb-14 text-muted-foreground">
            No usage-based traps. No surprise bills. Start with install and triage, then expand
            into public boards or automation when you need them.
          </p>

          <div className="grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Free</p>
              <p className="mb-6 text-5xl font-black tracking-tighter">
                $0
                <span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  '1 project',
                  '500 feedback / month',
                  'Optional public board',
                  'Dashboard + REST API',
                  '30-day history',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button variant="outline" className="w-full font-semibold">
                  Get started
                </Button>
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/10 transition-all hover:shadow-2xl hover:shadow-primary/15">
              <Badge className="absolute -top-3 left-6 bg-primary px-3.5 py-1 text-xs font-bold shadow-lg shadow-primary/30">
                Pro
              </Badge>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Pro</p>
              <p className="mb-6 text-5xl font-black tracking-tighter">
                $19
                <span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  'Unlimited projects',
                  'Unlimited feedback',
                  'Webhook integrations',
                  'MCP server + AI API',
                  'Custom widget branding',
                  'Unlimited history',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button className="w-full font-semibold shadow-lg shadow-primary/20">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-20 text-center md:px-16">
            {/* Dot grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            {/* Subtle glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
              style={{ background: 'hsl(var(--primary))' }}
            />
            <div className="relative">
              <h2 className="mb-4 text-4xl font-black tracking-tighter text-background md:text-5xl">
                Start with install.
                <br />
                Add public boards later.
              </h2>
              <p className="mx-auto mb-8 max-w-sm text-background/60">
                Free tier, no credit card required. Up and running in under 2 minutes, with
                public boards as an optional next step.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="h-12 bg-background px-8 font-semibold text-foreground shadow-2xl hover:bg-background/90"
                >
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
          <span className="text-sm font-bold tracking-tight">
            feedbacks
            <span className="text-primary">.dev</span>
          </span>
          <p className="text-center text-xs text-muted-foreground">
            Open source, MIT licensed — no fake stats, no fake testimonials.
          </p>
          <a
            href="https://github.com/syedirfan/feedbacks.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </div>
  )
}
