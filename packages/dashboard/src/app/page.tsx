import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CodeSnippet } from '@/components/code-snippet'
import {
  ArrowRight,
  Check,
  Github,
  Zap,
  Bot,
  ThumbsUp,
} from 'lucide-react'
import { WidgetDemo, ScrollHeader } from './widget-demo-client'

// ─── Code snippets ────────────────────────────────────────────────────────────

const installSnippet = `<script
  src="https://feedbacks.dev/widget/latest.js"
  data-project="your-project-key"
  defer
></script>`

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
    <div className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <ScrollHeader>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            feedbacks
            <span className="text-amber-500 dark:text-amber-400">.dev</span>
          </Link>
          <div className="flex items-center gap-2">
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
      <section className="relative overflow-hidden border-b bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="flex flex-col gap-14 md:flex-row md:items-center md:gap-12 lg:gap-20">
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                  Open source
                </Badge>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                  MIT license
                </Badge>
              </div>

              <h1 className="mb-5 text-5xl font-black leading-none tracking-tighter md:text-6xl lg:text-[4.5rem]">
                Feedback
                <br />
                infrastructure
                <br />
                <span className="text-amber-500 dark:text-amber-400">for builders.</span>
              </h1>

              <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
                One script tag to start. Public voting boards, a native AI agent API, and a
                real-time inbox — ready when your product grows.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth">
                  <Button size="lg" className="group font-semibold">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/syedirfan/feedbacks.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="gap-2 font-semibold">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { Icon: Zap, label: 'Under 10KB' },
                  { Icon: Bot, label: 'MCP / AI agents' },
                  { Icon: ThumbsUp, label: 'Public voting boards' },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-shrink-0 justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl bg-amber-400/10 blur-3xl dark:bg-amber-400/5" />
                <div className="relative">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
      <section className="border-b bg-zinc-950 px-6 py-14 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Install
          </p>
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-50">
            One script tag. 30 seconds.
          </h2>
          <CodeSnippet tabs={[{ label: 'HTML', code: installSnippet, language: 'html' }]} />
        </div>
      </section>

      {/* ── Three real differentiators ───────────────────────────────────────── */}
      <section className="border-b py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              {
                Icon: Zap,
                headline: 'Under 10KB',
                sub: 'Widget',
                body: 'Vanilla TypeScript, zero dependencies. Loads in one render cycle. Your users will never notice the overhead.',
              },
              {
                Icon: Bot,
                headline: 'AI Agent API',
                sub: 'MCP Protocol',
                body: 'Native MCP server for Claude Code, Cursor, and any AI agent. Query, triage, and act on feedback without leaving the conversation.',
              },
              {
                Icon: ThumbsUp,
                headline: 'Voting Boards',
                sub: 'Public feature requests',
                body: 'Every project gets a shareable feature board at no extra cost. Users upvote. You build what they actually want.',
              },
            ].map(({ Icon, headline, sub, body }, i) => (
              <div
                key={headline}
                className={`p-8 md:px-10 ${i === 0 ? 'md:pl-0' : ''} ${
                  i === 2 ? 'md:pr-0' : ''
                }`}
              >
                <Icon className="mb-4 h-6 w-6 text-amber-500" />
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
                Built for AI-first workflows
              </p>
              <h2 className="mb-5 text-4xl font-black leading-tight tracking-tighter md:text-5xl">
                Your AI agents
                <br />
                can talk to it.
              </h2>
              <p className="mb-8 max-w-sm leading-relaxed text-muted-foreground">
                feedbacks.dev ships with a native MCP server. Drop it into any AI coding tool and
                your agents can read, triage, and act on user feedback without leaving the
                conversation.
              </p>
              <ul className="space-y-3">
                {[
                  'Works with Claude Code, Claude Desktop, Cursor, Windsurf',
                  'Full REST API for custom integrations',
                  'API key auth — no OAuth dance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Getting started
          </p>
          <h2 className="mb-14 text-4xl font-black tracking-tighter md:text-5xl">
            Up in 2 minutes.
          </h2>
          <div className="divide-y">
            {[
              {
                num: '01',
                title: 'Paste the script tag',
                body: 'Add one line to your HTML. Works with any framework — React, Vue, Svelte, plain HTML. No build step, no config files.',
              },
              {
                num: '02',
                title: 'Your users start talking',
                body: 'The widget appears as a floating button. Users submit bugs, ideas, and praise. You start receiving signal, not noise.',
              },
              {
                num: '03',
                title: 'Triage from your dashboard — or delegate to your agent',
                body: 'Review and act on feedback in real-time. Or let an AI agent handle triage while you focus on building.',
              },
            ].map(({ num, title, body }) => (
              <div
                key={num}
                className="flex flex-col gap-4 py-8 md:flex-row md:items-baseline md:gap-12"
              >
                <span className="text-5xl font-black tracking-tighter text-muted-foreground/20 md:w-20 md:flex-shrink-0 md:text-right">
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

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mb-2 text-4xl font-black tracking-tighter md:text-5xl">
            Simple, honest.
          </h2>
          <p className="mb-14 text-muted-foreground">
            No usage-based traps. No surprise bills.
          </p>

          <div className="grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-background p-8">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Free</p>
              <p className="mb-6 text-4xl font-black tracking-tighter">
                $0
                <span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mb-8 space-y-2.5">
                {[
                  '1 project',
                  '500 feedback / month',
                  'Public voting board',
                  'Dashboard + REST API',
                  '30-day history',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-amber-500" />
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

            <div className="relative rounded-2xl border-2 border-foreground bg-background p-8">
              <Badge className="absolute -top-3.5 left-6 px-3 text-xs">Pro</Badge>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Pro</p>
              <p className="mb-6 text-4xl font-black tracking-tighter">
                $19
                <span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mb-8 space-y-2.5">
                {[
                  'Unlimited projects',
                  'Unlimited feedback',
                  'Webhook integrations',
                  'MCP server + AI API',
                  'Custom widget branding',
                  'Unlimited history',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button className="w-full font-semibold">
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
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center md:px-16 md:py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative">
              <h2 className="mb-4 text-4xl font-black tracking-tighter text-background md:text-5xl">
                Start hearing from
                <br />
                your users today.
              </h2>
              <p className="mx-auto mb-8 max-w-sm text-background/60">
                Free tier, no credit card required. Up and running in under 2 minutes.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-background font-semibold text-foreground hover:bg-background/90"
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
            <span className="text-amber-500 dark:text-amber-400">.dev</span>
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
