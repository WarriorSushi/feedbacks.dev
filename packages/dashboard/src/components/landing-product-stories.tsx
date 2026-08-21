import Image from 'next/image'
import {
  ArrowUpDown,
  ArrowRight,
  BellRing,
  Bug,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ClipboardPenLine,
  Code2,
  Clock3,
  ExternalLink,
  Flag,
  Globe2,
  House,
  Inbox,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  MonitorSmartphone,
  Paperclip,
  PanelLeftClose,
  Rocket,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function LandingProductStories() {
  return (
    <>
      <section id="product" className="landing-journey landing-reveal border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">From message to shipped fix</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">One small message becomes work your team can act on.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Your customer never leaves the product. feedbacks.dev keeps the useful context attached, then hands the important work to the tools your team already opens.</p>
          </div>

          <div className="landing-journey-grid mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_56px_1fr_56px_0.82fr] lg:gap-0">
            <ProductCaptureScene />
            <FlowConnector label="Arrives with context" />
            <FeedbackInboxScene />
            <FlowConnector label="Route or respond" />
            <WorkflowScene />
          </div>
        </div>
        <Image className="landing-section-mascot landing-mascot-journey" src="/mascots-v2/journey-runner.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 190px, 360px" aria-hidden="true" />
      </section>

      <section className="landing-context-section landing-reveal border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Context without interrogation</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">The short message is only the beginning.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">The page, browser, device, time, rating, and optional screenshot arrive beside the message. Your first reply can be useful instead of “which page were you on?”</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium">
              {['Captured automatically', 'Visible to your team', 'Screenshot stays optional'].map((item) => <span key={item} className="rounded-full border bg-card px-3 py-2">{item}</span>)}
            </div>
          </div>
          <ContextEvidenceScene />
        </div>
        <Image className="landing-section-mascot landing-mascot-context-v2" src="/mascots-v2/context-detective.png" alt="" width={1024} height={1536} sizes="(max-width: 767px) 150px, 230px" aria-hidden="true" />
      </section>

      <section className="landing-inbox-section landing-reveal border-b py-20 text-zinc-100 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Inside feedbacks.dev</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Open the inbox and know what deserves attention.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">New messages are distinct, technical context is already attached, and the next action is visible. It feels like triage, not archaeology.</p>
          </div>
          <TriageDashboardScene />
          <Image className="landing-section-mascot landing-mascot-inbox" src="/mascots-v2/inbox-controller.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 220px, 400px" aria-hidden="true" />
        </div>
      </section>

      <section className="landing-close-loop landing-reveal relative overflow-hidden border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Close the loop</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Let users see what happened next.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">Share a shipped update inside your product, or give ideas a real public home. Both views below are customer-facing, not another admin dashboard.</p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ProductUpdateScene />
            <PublicBoardScene />
          </div>
        </div>
        <Image className="landing-section-mascot landing-mascot-loop" src="/mascots-v2/loop-courier.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 210px, 370px" aria-hidden="true" />
      </section>
    </>
  )
}

function SceneLabel({ number, title }: { number: string; title: string }) {
  return (
    <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{number}</span>
      <span className="text-xs font-semibold">{title}</span>
    </div>
  )
}

function ProductCaptureScene() {
  return (
    <article className="landing-app-window landing-scene-card overflow-hidden rounded-2xl border bg-card">
      <SceneLabel number="01" title="Your product" />
      <div className="border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="ml-2 truncate font-mono">acme.app/settings/notifications</span>
        </div>
      </div>
      <div className="landing-capture-stage relative min-h-[390px] overflow-hidden bg-[linear-gradient(145deg,oklch(var(--card)),oklch(var(--muted)/0.45))] p-5">
        <div className="landing-capture-host max-w-[82%]">
          <p className="text-[10px] font-semibold text-muted-foreground">ACME APP</p>
          <h3 className="mt-3 text-xl font-semibold">Notification schedule</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Choose when your daily digest arrives.</p>
          <div className="mt-5 grid gap-3 rounded-xl border bg-background/80 p-4 text-xs">
            <div className="flex items-center justify-between"><span>Weekdays</span><span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">Mon to Fri</span></div>
            <div className="flex items-center justify-between border-t pt-3"><span>Delivery time</span><span className="font-semibold">9:00 AM</span></div>
          </div>
        </div>
        <span className="landing-capture-scrim absolute inset-0" aria-hidden="true" />
        <div className="landing-app-window landing-capture-pop absolute bottom-4 right-4 z-10 w-[86%] max-w-[290px] overflow-hidden rounded-xl border bg-card shadow-[0_24px_65px_-24px_rgb(0_0_0/0.45)]">
          <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="text-xs font-semibold">Send feedback</span><span className="text-[9px] font-medium text-rose-500">Bug</span></div>
          <div className="landing-capture-compose p-4">
            <p className="rounded-lg border bg-background p-3 text-xs leading-5">My notification time resets after I save.</p>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><Camera className="h-3 w-3" />Screenshot</span><span className="landing-capture-send rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Send</span></div>
          </div>
          <div className="landing-capture-success absolute inset-x-0 bottom-0 top-[37px] flex flex-col items-center justify-center bg-card px-5 text-center" aria-hidden="true">
            <span className="landing-capture-success-mark flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold">Feedback sent</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Message and context arrived together.</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function FlowConnector({ label }: { label: string }) {
  return (
    <div className="landing-flow-connector flex items-center justify-center py-1 text-primary lg:flex-col lg:py-0" aria-hidden="true">
      <span className="hidden max-w-20 text-center text-[9px] font-semibold leading-4 text-muted-foreground lg:block">{label}</span>
      <span className="landing-flow-line mx-3 h-px flex-1 bg-primary/30 lg:mx-0 lg:my-3 lg:h-12 lg:w-px lg:flex-none" />
      <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
    </div>
  )
}

function FeedbackInboxScene() {
  return (
    <article className="landing-app-window landing-scene-card overflow-hidden rounded-2xl border bg-card">
      <SceneLabel number="02" title="feedbacks.dev" />
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div><p className="text-xs font-semibold">ACME App inbox</p><p className="mt-1 text-[9px] text-muted-foreground">1 new message</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-300"><CircleDot className="h-3 w-3" />Live</span>
      </div>
      <div className="min-h-[390px] p-4">
        <div className="landing-inbox-arrival rounded-xl border border-primary/25 bg-primary/[0.055] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
            <div><p className="text-xs font-semibold leading-5">Notification time resets after save</p><p className="mt-1 text-[9px] text-muted-foreground">Bug · just now</p></div>
            <span className="ml-auto rounded-md bg-rose-500/10 px-2 py-1 text-[9px] font-semibold text-rose-600 dark:text-rose-300">New</span>
          </div>
        </div>
        <div className="landing-inbox-detail mt-4 rounded-xl border p-4">
          <p className="text-sm font-semibold leading-6">“My notification time resets after I save.”</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <ContextChip Icon={Globe2} text="/settings/notifications" />
            <ContextChip Icon={MonitorSmartphone} text="Chrome · macOS" />
            <ContextChip Icon={Clock3} text="Just now" />
            <ContextChip Icon={Paperclip} text="Screenshot" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4 text-[9px] font-medium"><span className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-600 dark:text-rose-300">Bug</span><span className="rounded-md bg-primary/10 px-2 py-1 text-primary">Notifications</span><span className="rounded-md bg-muted px-2 py-1">High signal</span></div>
        </div>
      </div>
    </article>
  )
}

function ContextChip({ Icon, text }: { Icon: typeof Globe2; text: string }) {
  return <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-muted/65 px-2 py-2 text-muted-foreground"><Icon className="h-3 w-3 shrink-0 text-primary" /><span className="truncate">{text}</span></span>
}

function WorkflowScene() {
  const destinations = [
    { badge: 'GH', title: 'GitHub issue #184', meta: 'Created with context' },
    { badge: 'SL', title: '#product alert', meta: 'Team notified' },
    { badge: '↗', title: 'Product update', meta: 'Ready when shipped' },
  ]
  return (
    <article className="landing-app-window landing-scene-card overflow-hidden rounded-2xl border bg-card">
      <SceneLabel number="03" title="Your workflow" />
      <div className="landing-workflow-stack flex min-h-[443px] flex-col justify-center gap-3 p-4">
        {destinations.map((item, index) => (
          <div key={item.title} className="landing-route-card flex items-center gap-3 rounded-xl border bg-background p-3" style={{ animationDelay: `${index * 180}ms` }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-[10px] font-bold text-background">{item.badge}</span>
            <div className="min-w-0"><p className="truncate text-xs font-semibold">{item.title}</p><p className="mt-1 text-[9px] text-muted-foreground">{item.meta}</p></div>
            <Check className="ml-auto h-4 w-4 text-emerald-500" />
          </div>
        ))}
        <div className="mt-2 rounded-xl border border-dashed bg-muted/25 p-4 text-center">
          <Webhook className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2 text-xs font-semibold">Or send it anywhere</p>
          <p className="mt-1 text-[9px] leading-4 text-muted-foreground">Email, Discord, or your own webhook</p>
        </div>
      </div>
    </article>
  )
}

function ContextEvidenceScene() {
  return (
    <div className="landing-evidence-grid grid gap-4 sm:grid-cols-2">
      <div className="landing-app-window landing-evidence-card landing-evidence-window rounded-2xl border bg-card p-5 sm:row-span-2">
        <div className="landing-window-titlebar flex items-center justify-between"><span className="inline-flex items-center gap-2 text-xs font-semibold"><Camera className="h-4 w-4 text-primary" />What they saw</span><span className="text-[9px] text-muted-foreground">Optional screenshot</span></div>
        <div className="mt-5 rounded-xl border bg-muted/30 p-4">
          <p className="text-[9px] font-semibold text-muted-foreground">ACME APP · NOTIFICATIONS</p>
          <div className="landing-evidence-highlight mt-4 rounded-lg border border-rose-400/40 bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between text-[10px]"><span>Delivery time</span><span className="font-semibold">9:00 AM</span></div>
            <p className="mt-3 rounded-md bg-rose-500/10 p-2 text-[9px] font-medium text-rose-600 dark:text-rose-300">Resets to 8:00 AM after save</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">A concrete screenshot beats three rounds of reproduction questions.</p>
      </div>
      <div className="landing-evidence-card landing-evidence-field rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold"><Globe2 className="h-4 w-4 text-primary" />Page</div>
        <p className="mt-4 break-all font-mono text-sm font-semibold">/settings/notifications</p>
        <p className="mt-2 text-[10px] text-muted-foreground">Captured automatically</p>
      </div>
      <div className="landing-evidence-card landing-evidence-field rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold"><MonitorSmartphone className="h-4 w-4 text-primary" />Environment</div>
        <p className="mt-4 text-sm font-semibold">Chrome 140 · macOS</p>
        <p className="mt-2 text-[10px] text-muted-foreground">1440 × 900 · English</p>
      </div>
      <div className="landing-evidence-card landing-evidence-status rounded-2xl border bg-card p-5 sm:col-span-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">
          <span className="font-semibold">Everything travels together</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock3 className="h-3.5 w-3.5 text-primary" />Timestamp</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" />Category</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Paperclip className="h-3.5 w-3.5 text-primary" />Attachment</span>
        </div>
      </div>
    </div>
  )
}

function TriageDashboardScene() {
  const rows = [
    {
      title: 'My notification time resets after I save.',
      preview: 'I expected 9:00 AM, but the page shows 8:00 AM when I return.',
      status: 'New',
      statusTone: 'bg-rose-400',
      type: 'Bug',
      Icon: Bug,
      source: 'Widget',
      time: 'Just now',
      tag: 'Notifications',
      unread: true,
      priority: 'High',
    },
    {
      title: 'Keyboard shortcuts would make capture much faster.',
      preview: 'A quick command menu would help us file ideas without leaving the keyboard.',
      status: 'Planned',
      statusTone: 'bg-sky-400',
      type: 'Idea',
      Icon: Lightbulb,
      source: 'Widget',
      time: '42m',
      tag: 'Editor',
      unread: false,
    },
    {
      title: 'The new editor feels much faster.',
      preview: 'Everything opens immediately now. Really nice improvement.',
      status: 'Reviewed',
      statusTone: 'bg-emerald-400',
      type: 'Praise',
      Icon: MessageSquareText,
      source: 'Public board',
      time: '3h',
      tag: 'Performance',
      unread: false,
    },
  ]
  const navGroups: { label?: string; items: { label: string; Icon: LucideIcon; active?: boolean }[] }[] = [
    { items: [{ label: 'Home', Icon: House }] },
    { label: 'Collect', items: [{ label: 'Feedback form', Icon: ClipboardPenLine }, { label: 'Feedback inbox', Icon: Inbox, active: true }] },
    { label: 'Share with users', items: [{ label: 'Updates for users', Icon: Megaphone }, { label: 'Public feedback board', Icon: Globe2 }] },
    { label: 'Connect', items: [{ label: 'Install & verify', Icon: Code2 }, { label: 'Integrations', Icon: Webhook }] },
  ]

  return (
    <div className="landing-triage-stage relative mx-auto mt-12 max-w-6xl">
      <span className="landing-triage-backlight" aria-hidden="true" />
      <figure className="landing-app-window landing-triage-dashboard relative z-[1] overflow-hidden rounded-2xl border border-white/10 bg-[#0d100d]">
        <div className="landing-window-titlebar flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-300 text-[10px] font-black text-zinc-950">f.</span><p className="text-xs font-semibold">feedbacks.dev</p></div>
          <span className="inline-flex items-center gap-2 text-[9px] text-zinc-500"><CircleDot className="h-3 w-3 text-lime-300" />ACME App workspace</span>
        </div>

        <div className="grid min-h-[530px] md:grid-cols-[190px_1fr]">
          <aside className="landing-triage-sidebar hidden flex-col border-r border-white/10 bg-white/[0.018] md:flex" aria-label="Dashboard example">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-3"><PanelLeftClose className="h-3.5 w-3.5 text-zinc-500" /><span className="text-[11px] font-semibold">feedbacks.dev</span></div>
            <div className="border-b border-white/10 p-2.5">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] px-2.5 py-2">
                <span className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-lime-300/10 text-[10px] font-black text-lime-200">A</span><span className="min-w-0"><span className="block text-[8px] font-medium uppercase tracking-[0.11em] text-zinc-600">Current project</span><span className="block truncate text-[10px] font-semibold text-zinc-300">ACME App</span></span></span>
                <ChevronDown className="h-3 w-3 text-zinc-600" />
              </div>
            </div>
            <nav className="flex-1 space-y-3 overflow-hidden p-2.5 text-[9px]" aria-label="Workspace navigation">
              {navGroups.map((group) => (
                <div key={group.label || 'home'} className="space-y-0.5">
                  {group.label && <p className="mb-1 px-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{group.label}</p>}
                  {group.items.map(({ label, Icon, active }) => (
                    <span key={label} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium ${active ? 'bg-lime-300/10 text-lime-200' : 'text-zinc-500'}`}><Icon className={`h-3.5 w-3.5 ${active ? 'text-lime-300' : ''}`} />{label}</span>
                  ))}
                </div>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-white/10 p-2.5"><span className="rounded-md border border-white/10 px-2 py-1 text-[8px] text-zinc-500">Theme</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-300/10 text-[9px] font-semibold text-lime-200">M</span></div>
          </aside>

          <div className="landing-triage-main bg-[#090c09] p-4 sm:p-5">
            <header className="flex items-end justify-between gap-5 border-b border-white/10 pb-4">
              <div><p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-lime-300">Inbox</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Feedback</h3><p className="mt-1 text-[10px] text-zinc-500">Review new messages and move the useful signal forward.</p></div>
              <div className="text-right"><p className="text-lg font-semibold tabular-nums">3</p><p className="text-[9px] text-zinc-500">messages</p></div>
            </header>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.018] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-8 min-w-[180px] flex-1 items-center gap-2 rounded-md border border-white/10 bg-black/10 px-3 text-[9px] text-zinc-500"><Search className="h-3.5 w-3.5" />Search feedback…</div>
                {['All', 'Unread', 'New', 'Planned'].map((filter, index) => <span key={filter} className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[8px] font-medium ${index === 0 ? 'border-lime-300/25 bg-lime-300/10 text-zinc-200' : 'border-transparent bg-white/[0.035] text-zinc-500'}`}>{index > 0 && <span className={`h-1.5 w-1.5 rounded-full ${index === 1 ? 'bg-lime-300' : index === 2 ? 'bg-rose-400' : 'bg-sky-400'}`} />}{filter}</span>)}
                <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/[0.035] px-2 text-[8px] text-zinc-500"><SlidersHorizontal className="h-3 w-3" />More filters</span>
                <span className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2 text-[8px] text-zinc-400"><ArrowUpDown className="h-3 w-3" />Newest</span>
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-[8px]"><span className="text-zinc-600">Project</span><span className="rounded-md bg-white/[0.035] px-2 py-1 text-zinc-500">All projects</span><span className="rounded-md border border-lime-300/25 bg-lime-300/10 px-2 py-1 font-medium text-lime-200">ACME App</span></div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.012]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.018] px-4 py-2.5 text-[9px] text-zinc-500"><span className="h-3.5 w-3.5 rounded border border-white/20" />Select all on this page</div>
              {rows.map(({ title, preview, status, statusTone, type, Icon, source, time, tag, unread, priority }) => (
                <div key={title} className={`landing-inbox-row border-b border-white/10 px-4 py-3 last:border-b-0 ${unread ? 'is-active' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-white/20" />
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${unread ? 'bg-lime-300 shadow-[0_0_0_3px_rgb(190_242_100/0.11)]' : 'bg-transparent'}`} />
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    <div className="min-w-0 flex-1"><p className={`truncate text-[11px] leading-4 ${unread ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>{title}</p><p className="mt-1 truncate text-[9px] text-zinc-600">{preview}</p><div className="mt-2 flex flex-wrap items-center gap-1.5 text-[8px] text-zinc-500"><span className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${statusTone}`} />{status}</span>{priority && <><span className="text-zinc-700">·</span><span className="inline-flex items-center gap-1 font-medium text-amber-300"><Flag className="h-2.5 w-2.5" />{priority}</span></>}<span className="text-zinc-700">·</span><span>{type}</span><span className="text-zinc-700">·</span><span>{source}</span><span className="text-zinc-700">·</span><span>ACME App</span><span className="rounded border border-white/10 px-1.5 py-0.5 text-[7px]">{tag}</span><span className="text-zinc-700">·</span><span>{time}</span></div></div>
                    {type === 'Praise' && <span className="mt-1 flex gap-px">{Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </figure>
    </div>
  )
}

function ProductUpdateScene() {
  return (
    <article className="landing-app-window landing-loop-card overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">What customers see inside ACME App</p><p className="mt-1 text-[9px] text-muted-foreground">In-product update</p></div><span className="landing-update-bell"><BellRing className="h-4 w-4 text-primary" /></span></div>
      <div className="landing-update-stage relative min-h-[390px] bg-[radial-gradient(circle_at_25%_15%,oklch(var(--primary)/0.14),transparent_42%),oklch(var(--muted)/0.28)] p-5 sm:p-7">
        <div className="relative z-0 max-w-sm">
          <p className="text-[10px] font-semibold text-muted-foreground">ACME APP</p>
          <h3 className="mt-3 text-2xl font-semibold">Your notes, in motion.</h3>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">A calm home for daily thinking and useful reminders.</p>
        </div>
        <div className="landing-update-scrim absolute inset-0 z-[1]" aria-hidden="true" />
        <div className="landing-app-window landing-update-pop absolute bottom-5 right-5 z-[2] w-[82%] max-w-sm overflow-hidden rounded-xl border bg-card">
          <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-semibold"><Rocket className="h-3.5 w-3.5 text-primary" />What&apos;s new</span><span className="text-[9px] text-muted-foreground">Just shipped</span></div>
          <div className="p-4"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-300">Shipped</span><h4 className="mt-3 text-base font-semibold">Notification schedules now save instantly</h4><p className="mt-2 text-xs leading-5 text-muted-foreground">Your chosen time now stays exactly where you put it, on every device.</p><p className="mt-4 text-[9px] font-semibold text-primary">Thanks to everyone who reported this.</p></div>
        </div>
      </div>
    </article>
  )
}

function PublicBoardScene() {
  return (
    <article className="landing-app-window landing-loop-card overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">What customers see on the public web</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">feedbacks.dev/p/acme-app</p></div><ExternalLink className="h-4 w-4 text-primary" /></div>
      <div className="min-h-[390px] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">A</span><div><h3 className="text-sm font-semibold">ACME App feedback</h3><p className="mt-1 text-[9px] text-muted-foreground">Ideas, decisions, and shipped work</p></div></div></div><span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Submit idea</span></div>
        <div className="mt-5 flex gap-2 border-y py-3 text-[9px]"><span className="rounded-full bg-foreground px-3 py-1 font-semibold text-background">Top ideas</span><span className="rounded-full px-3 py-1 text-muted-foreground">Planned</span><span className="rounded-full px-3 py-1 text-muted-foreground">Shipped</span></div>
        <div className="divide-y">
          <BoardRow votes="38" title="Add a weekly review view" meta="Planned · 12 replies" active />
          <BoardRow votes="24" title="Pin notes to the top" meta="In progress · 6 replies" />
          <BoardRow votes="17" title="Notification schedules" meta="Shipped · 4 replies" />
        </div>
        <div className="landing-board-response mt-3 flex items-start gap-2 rounded-lg bg-primary/[0.055] p-3 text-[10px] leading-4"><MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span><strong>Official response:</strong> Weekly review is planned for the next release. Follow this idea to get the update.</span></div>
      </div>
    </article>
  )
}

function BoardRow({ votes, title, meta, active = false }: { votes: string; title: string; meta: string; active?: boolean }) {
  return (
    <div className={`landing-board-row flex items-center gap-3 py-3 ${active ? 'is-active' : ''}`}>
      <span className="landing-board-vote flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border bg-background"><ChevronUp className="h-3 w-3 text-primary" /><span className="text-[9px] font-semibold">{votes}</span></span>
      <div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="mt-1 text-[9px] text-muted-foreground">{meta}</p></div>
      {active && <Lightbulb className="ml-auto h-4 w-4 text-primary" />}
    </div>
  )
}
