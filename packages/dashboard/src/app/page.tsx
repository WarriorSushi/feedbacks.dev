import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLAN_MATRIX, generateInstallSnippets } from '@feedbacks/shared'
import { CodeSnippet } from '@/components/code-snippet'
import { LandingTerminalDemo } from '@/components/terminal-demo'
import { publicEnv } from '@/lib/public-env'
import { createServerSupabase } from '@/lib/supabase-server'
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
  Code2,
  LayoutDashboard,
  Vote,
  Compass,
  Webhook,
  Terminal,
  Globe,
  Boxes,
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

const webhookSnippet = `// Incoming webhook payload
{
  "event": "feedback.created",
  "feedback": {
    "type": "bug",
    "message": "CSV export crashes on large sets",
    "url": "https://app.example.com/export",
    "rating": 2,
    "email": "user@example.com"
  },
  "project": {
    "name": "My SaaS App"
  }
}`

const freePlan = PLAN_MATRIX.free
const proPlan = PLAN_MATRIX.pro

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
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
            <Link href="#features">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Features
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Pricing
              </Button>
            </Link>
            <a
              href="https://github.com/WarriorSushi/feedbacks.dev-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="font-semibold">
                  Go to Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </ScrollHeader>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        {/* Atmospheric gradient backdrop */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-background" />
          <div
            className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full opacity-25 blur-[120px]"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -right-1/4 top-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: 'radial-gradient(circle, hsl(85 60% 40%) 0%, transparent 70%)' }}
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

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="flex flex-col gap-14 md:flex-row md:items-center md:gap-12 lg:gap-20">
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  Install-first feedback stack
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Code2 className="h-3 w-3" />
                  Widget under 20KB
                </Badge>
              </div>

              <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tighter md:text-6xl lg:text-7xl">
                Install feedback
                <br />
                in minutes.
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Triage the right issues fast.
                </span>
              </h1>

              <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Create a project, paste one Website snippet, and verify a real submission without
                wading through setup screens. feedbacks.dev keeps the first run small, captures
                useful context automatically, and gives you public boards only when you are ready
                to open the workflow up.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                  <Button size="lg" className="group h-12 px-7 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25">
                    {isLoggedIn ? 'Go to Dashboard' : 'Create project'}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/boards">
                  <Button variant="outline" size="lg" className="h-12 gap-2 font-semibold">
                    Browse public boards
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  { Icon: Zap, label: 'Create project' },
                  { Icon: Code2, label: 'Paste Website snippet' },
                  { Icon: LayoutDashboard, label: 'Verify and triage first item' },
                  { Icon: Vote, label: 'Publish a board later' },
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
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Quick start
              </p>
              <h2 className="text-lg font-bold tracking-tight text-zinc-50">
                Create a project. Copy the Website snippet. Verify one submission.
              </h2>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-3">
              <LandingTerminalDemo websiteSnippet={installSnippet} />
              <p className="text-sm text-zinc-500">
                The terminal mirrors the first-run loop: inspect the Website snippet, verify the
                widget locally, then confirm the first report lands with useful context.
              </p>
            </div>
            <div className="space-y-3">
              <CodeSnippet
                className="border-zinc-800 bg-zinc-900/90 text-zinc-50"
                tabs={[{ label: 'HTML', code: installSnippet, language: 'html' }]}
              />
              <p className="text-sm text-zinc-500">
                Website is the recommended default. React and Vue snippets are ready when you need
                them, but the first-run path stays intentionally small. Under 20KB gzipped.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────────── */}
      <section id="features" className="relative border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Install first
            </p>
            <h2 className="mb-4 text-4xl font-black tracking-tighter md:text-5xl">
              Start with the install loop.
              <br />
              Expand when the workflow earns it.
            </h2>
            <p className="text-muted-foreground">
              The product is full-surface, but the path to first value is not. Get the widget
              live, confirm feedback lands in the inbox, then add routing, public boards, and
              automation once the core loop is working.
            </p>
          </div>

          {/* Top row: 3 primary features */}
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
            {[
              {
                Icon: Code2,
                headline: 'Embeddable Widget',
                sub: 'Install in minutes',
                body: 'Create a project, copy the Website snippet, and get a live widget without a multi-step setup flow. Modal, inline, and trigger modes stay available when you need them.',
              },
              {
                Icon: LayoutDashboard,
                headline: 'Smart Dashboard',
                sub: 'Triage with context',
                body: 'Every submission arrives with URL, browser, rating, and optional screenshot so the inbox helps you decide what matters quickly instead of becoming another pile of messages.',
              },
              {
                Icon: Webhook,
                headline: 'Workflow Routing',
                sub: 'Move signal fast',
                body: 'Send the important items into Slack, Discord, GitHub, or your own endpoints once the first install is already working. Integrations stay secondary to setup, not in the way of it.',
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

          {/* Bottom row: 4 secondary features */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Vote,
                title: 'Public Boards',
                desc: 'Turn repeated requests into a public roadmap and voting surface after the inbox is already collecting good signal.',
              },
              {
                Icon: Compass,
                title: 'Board Directory',
                desc: 'Browse public boards that show how teams turn private feedback loops into credible public product communication.',
              },
              {
                Icon: Bot,
                title: 'AI Agent API',
                desc: 'MCP server for Claude, Cursor, and other AI agents. REST API with key auth. Programmatic feedback at scale.',
              },
              {
                Icon: Webhook,
                title: 'Webhooks',
                desc: 'Push to Slack, Discord, GitHub Issues, or any custom endpoint. Real-time delivery with retry and logging.',
              },
              {
                Icon: Globe,
                title: 'Source Available',
                desc: 'FSL-1.1-MIT today, MIT later. Self-hostable. Full codebase on GitHub. No vendor lock-in, no data hostage situations.',
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

      {/* ── AI Agent API deep dive ────────────────────────────────────────────── */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
            <div className="flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Built for automation
              </p>
              <h2 className="mb-5 text-4xl font-black leading-tight tracking-tighter md:text-5xl">
                Your AI agents
                <br />
                can file bugs too.
              </h2>
              <p className="mb-8 max-w-sm leading-relaxed text-muted-foreground">
                Connect Claude, GPT, Cursor, or any AI agent to your feedback pipeline.
                The MCP server and REST API let machines submit, query, and triage feedback
                alongside your team.
              </p>
              <ul className="space-y-3">
                {[
                  'Native MCP server for Claude Code, Cursor, and Windsurf',
                  'Full REST API with simple API key authentication',
                  'Submit, list, search, and update feedback programmatically',
                  'No OAuth complexity — works in seconds',
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

      {/* ── Webhooks section ──────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col-reverse gap-12 md:flex-row md:items-start md:gap-16">
            <div className="flex-1">
              <CodeSnippet
                tabs={[
                  { label: 'Webhook Payload', code: webhookSnippet, language: 'json' },
                ]}
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Integrations
              </p>
              <h2 className="mb-5 text-4xl font-black leading-tight tracking-tighter md:text-5xl">
                Pipe feedback
                <br />
                where you already work.
              </h2>
              <p className="mb-8 max-w-sm leading-relaxed text-muted-foreground">
                Webhooks fire on every new submission. Route feedback to Slack channels,
                Discord servers, GitHub Issues, or your own internal tools automatically.
              </p>
              <ul className="space-y-3">
                {[
                  'Slack, Discord, and generic webhook endpoints',
                  'Full payload with feedback context and metadata',
                  'Delivery logs with retry on failure',
                  'Configure per-project in the dashboard',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Getting started
          </p>
          <h2 className="mb-14 text-4xl font-black tracking-tighter md:text-5xl">
            From install to first signal in three steps.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Create the project',
                body: 'Start with one project and get the Website snippet immediately. No wizard, no setup maze, no advanced configuration wall.',
                Icon: LayoutDashboard,
              },
              {
                num: '02',
                title: 'Paste the snippet',
                body: 'Install the widget where your global scripts load, then open the hosted verify page and send one real test submission.',
                Icon: Code2,
              },
              {
                num: '03',
                title: 'Triage your inbox',
                body: 'Once the first item lands, route what matters, publish a board if you want public signal, and build from a feedback loop that already proved itself.',
                Icon: MessageSquare,
              },
            ].map(({ num, title, body, Icon }) => (
              <div key={num} className="relative rounded-2xl border bg-card/50 p-8">
                <span className="mb-6 block text-5xl font-black tracking-tighter text-primary/15">
                  {num}
                </span>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why feedbacks.dev ─────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Why feedbacks.dev
            </p>
            <h2 className="mb-4 text-4xl font-black tracking-tighter md:text-5xl">
              Built different. On purpose.
            </h2>
            <p className="text-muted-foreground">
              feedbacks.dev is opinionated about one thing: first-run success. The product earns
              the right to be broader by making the install, verify, and triage loop feel obvious
              before it asks you to think about anything else.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: Zap,
                title: 'Lightweight widget',
                desc: 'Under 20KB gzipped. No iframe bloat, no third-party trackers. Loads fast, runs fast, stays out of the way.',
              },
              {
                Icon: Shield,
                title: 'Privacy-first',
                desc: 'No analytics on your users. No tracking pixels. Email collection is optional and controlled by you.',
              },
              {
                Icon: Boxes,
                title: 'Framework agnostic',
                desc: 'One script tag works everywhere. React wrapper, Vue wrapper, or plain HTML. Your stack, your choice.',
              },
              {
                Icon: Sparkles,
                title: 'Rich context',
                desc: 'Every submission captures URL, browser, OS, rating, and optional screenshot. Debug-ready from submission.',
              },
              {
                Icon: MessageSquare,
                title: 'Team notes',
                desc: 'Add internal notes to any feedback item. Keep context private between your team while tracking resolution.',
              },
              {
                Icon: Globe,
                title: 'Self-hostable',
                desc: 'Fork it, run it on your own infra, customize everything. FSL license now, MIT conversion after the change date.',
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-xl border bg-card/30 p-5 transition-colors hover:bg-card/60">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold tracking-tight">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Pricing
            </p>
            <h2 className="mb-3 text-4xl font-black tracking-tighter md:text-5xl">
              Simple. Honest. No traps.
            </h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Start free, upgrade when you need more. Two tiers, webhook-backed billing truth, and no usage-based surprises.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Free</p>
              <p className="mb-1 text-5xl font-black tracking-tighter">
                ${freePlan.monthlyPrice}
              </p>
              <p className="mb-6 text-sm text-muted-foreground">Free forever. No credit card.</p>
              <ul className="mb-8 space-y-3">
                {[
                  `${freePlan.projectLimit} project`,
                  `${freePlan.feedbackMonthlyLimit} feedback / month`,
                  'Dashboard + widget install',
                  'Optional public board',
                  `${freePlan.historyDays}-day history`,
                  'Community support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                <Button variant="outline" className="w-full font-semibold">
                  {isLoggedIn ? 'Go to Dashboard' : 'Get started'}
                </Button>
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/10 transition-all hover:shadow-2xl hover:shadow-primary/15">
              <Badge className="absolute -top-3 left-6 bg-primary px-3.5 py-1 text-xs font-bold shadow-lg shadow-primary/30">
                Pro
              </Badge>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Pro</p>
              <p className="mb-1 text-5xl font-black tracking-tighter">
                ${proPlan.monthlyPrice}
                <span className="text-lg font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mb-6 text-sm text-muted-foreground">Everything, unlimited.</p>
              <ul className="mb-8 space-y-3">
                {[
                  'Unlimited projects',
                  'Unlimited feedback',
                  'Webhook integrations',
                  'MCP server + AI agent API',
                  'Custom widget branding',
                  'Unlimited history',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                <Button className="w-full font-semibold shadow-lg shadow-primary/20">
                  {isLoggedIn ? 'Go to Dashboard' : 'Start free trial'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
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
            {/* Glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
              style={{ background: 'hsl(var(--primary))' }}
            />
            <div className="relative">
              <h2 className="mb-4 text-4xl font-black tracking-tighter text-background md:text-5xl">
                Install the widget.
                <br />
                Verify the first submission.
              </h2>
              <p className="mx-auto mb-8 max-w-md text-background/60">
                Start free, keep the setup path small, and add the public and automation layers
                only after the core loop is working.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                  <Button
                    size="lg"
                    className="h-12 bg-background px-8 font-semibold text-foreground shadow-2xl hover:bg-background/90"
                  >
                    {isLoggedIn ? 'Go to Dashboard' : 'Start Free'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/WarriorSushi/feedbacks.dev-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 gap-2 border-background/20 font-semibold text-background hover:bg-background/10 hover:text-background"
                  >
                    <Github className="h-4 w-4" />
                    Star on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm font-bold tracking-tight">
            feedbacks
            <span className="text-primary">.dev</span>
          </span>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/boards" className="transition-colors hover:text-foreground">
              Boards
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <a
              href="https://github.com/WarriorSushi/feedbacks.dev-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Source available &middot; FSL-1.1-MIT
            </p>
            <a
              href="https://github.com/WarriorSushi/feedbacks.dev-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
