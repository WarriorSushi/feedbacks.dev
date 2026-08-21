import Image from 'next/image'
import {
  ArrowRight,
  BellRing,
  Camera,
  Check,
  ChevronUp,
  CircleDot,
  Clock3,
  ExternalLink,
  GitBranch,
  Globe2,
  Inbox,
  Lightbulb,
  MessageSquareText,
  MonitorSmartphone,
  Paperclip,
  Rocket,
  Search,
  Tag,
  Webhook,
} from 'lucide-react'

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
          <span className="ml-2 truncate font-mono">orbit-notes.app/settings/notifications</span>
        </div>
      </div>
      <div className="relative min-h-[390px] bg-[linear-gradient(145deg,oklch(var(--card)),oklch(var(--muted)/0.45))] p-5">
        <div className="max-w-[82%]">
          <p className="text-[10px] font-semibold text-muted-foreground">ORBIT NOTES</p>
          <h3 className="mt-3 text-xl font-semibold">Notification schedule</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Choose when your daily digest arrives.</p>
          <div className="mt-5 grid gap-3 rounded-xl border bg-background/80 p-4 text-xs">
            <div className="flex items-center justify-between"><span>Weekdays</span><span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">Mon to Fri</span></div>
            <div className="flex items-center justify-between border-t pt-3"><span>Delivery time</span><span className="font-semibold">9:00 AM</span></div>
          </div>
        </div>
        <div className="landing-app-window landing-capture-pop absolute bottom-4 right-4 w-[86%] max-w-[290px] overflow-hidden rounded-xl border bg-card shadow-[0_24px_65px_-24px_rgb(0_0_0/0.45)]">
          <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="text-xs font-semibold">Send feedback</span><span className="text-[9px] font-medium text-rose-500">Bug</span></div>
          <div className="p-4">
            <p className="rounded-lg border bg-background p-3 text-xs leading-5">My notification time resets after I save.</p>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><Camera className="h-3 w-3" />Screenshot</span><span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Send</span></div>
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
        <div><p className="text-xs font-semibold">Orbit Notes inbox</p><p className="mt-1 text-[9px] text-muted-foreground">1 new message</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-300"><CircleDot className="h-3 w-3" />Live</span>
      </div>
      <div className="min-h-[390px] p-4">
        <div className="rounded-xl border border-primary/25 bg-primary/[0.055] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
            <div><p className="text-xs font-semibold leading-5">Notification time resets after save</p><p className="mt-1 text-[9px] text-muted-foreground">Bug · just now</p></div>
            <span className="ml-auto rounded-md bg-rose-500/10 px-2 py-1 text-[9px] font-semibold text-rose-600 dark:text-rose-300">New</span>
          </div>
        </div>
        <div className="mt-4 rounded-xl border p-4">
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
      <div className="flex min-h-[443px] flex-col justify-center gap-3 p-4">
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
          <p className="text-[9px] font-semibold text-muted-foreground">ORBIT NOTES · NOTIFICATIONS</p>
          <div className="mt-4 rounded-lg border border-rose-400/40 bg-card p-3 shadow-sm">
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
    ['Notification time resets after save', 'Bug · just now', 'New'],
    ['Keyboard shortcuts for quick capture', 'Idea · 42m', 'Planned'],
    ['The new editor feels much faster', 'Praise · 3h', 'Reviewed'],
  ]
  return (
    <figure className="landing-app-window landing-triage-dashboard mx-auto mt-12 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d100d] shadow-[0_40px_120px_-50px_rgb(0_0_0/0.95)]">
      <div className="landing-window-titlebar flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-300 text-xs font-black text-zinc-950">f.</span><div><p className="text-xs font-semibold">feedbacks.dev dashboard</p><p className="mt-0.5 text-[9px] text-zinc-500">Project: Orbit Notes</p></div></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-zinc-400"><CircleDot className="h-3 w-3 text-lime-300" />Inbox live</span>
      </div>
      <div className="grid min-h-[500px] md:grid-cols-[160px_0.88fr_1.12fr]">
        <nav className="hidden border-r border-white/10 bg-white/[0.018] p-3 text-[10px] text-zinc-500 md:block" aria-label="Dashboard example">
          <p className="px-2 pb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Collect</p>
          <span className="flex items-center gap-2 rounded-md bg-lime-300/10 px-2 py-2.5 font-semibold text-lime-200"><Inbox className="h-3.5 w-3.5" />Feedback inbox</span>
          <span className="mt-1 flex items-center gap-2 px-2 py-2.5"><MessageSquareText className="h-3.5 w-3.5" />Feedback form</span>
          <p className="mt-5 px-2 pb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Share</p>
          <span className="flex items-center gap-2 px-2 py-2.5"><Rocket className="h-3.5 w-3.5" />Product updates</span>
          <span className="flex items-center gap-2 px-2 py-2.5"><Globe2 className="h-3.5 w-3.5" />Public board</span>
        </nav>
        <div className="border-b border-white/10 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-white/10 p-3"><div className="flex min-h-9 flex-1 items-center gap-2 rounded-md border border-white/10 px-3 text-[10px] text-zinc-500"><Search className="h-3.5 w-3.5" />Search feedback</div><span className="rounded-md border border-white/10 px-3 py-2 text-[9px]">Filter</span></div>
          {rows.map(([title, meta, status], index) => (
            <div key={title} className={`landing-inbox-row border-b border-white/10 p-4 ${index === 0 ? 'is-active' : ''}`}>
              <div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-rose-400' : index === 1 ? 'bg-sky-400' : 'bg-amber-300'}`} /><div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-200">{title}</p><p className="mt-1 text-[9px] text-zinc-500">{meta}</p></div><span className="ml-auto text-[9px] text-zinc-500">{status}</span></div>
            </div>
          ))}
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap gap-2 text-[9px]"><span className="rounded-md bg-rose-400/10 px-2 py-1 text-rose-300">Bug</span><span className="rounded-md bg-lime-300/10 px-2 py-1 text-lime-200">Notifications</span><span className="rounded-md bg-amber-300/10 px-2 py-1 text-amber-200">High signal</span></div>
          <h3 className="mt-5 max-w-lg text-xl font-semibold leading-7 sm:text-2xl">Notification time resets after save</h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">My notification time resets after I save. I expected 9:00 AM, but the page shows 8:00 AM when I return.</p>
          <dl className="mt-7 divide-y divide-white/10 border-y border-white/10 text-xs">
            <div className="flex items-center justify-between py-3"><dt className="text-zinc-500">Status</dt><dd className="font-medium text-lime-200">Planned</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-zinc-500">Page</dt><dd className="font-mono text-zinc-300">/settings/notifications</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-zinc-500">Destination</dt><dd className="font-medium">GitHub issue #184</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-md bg-lime-300 px-3 py-2 text-[10px] font-bold text-zinc-950"><GitBranch className="h-3.5 w-3.5" />Open issue</span><span className="rounded-md border border-white/10 px-3 py-2 text-[10px] font-semibold">Add note</span></div>
        </div>
      </div>
    </figure>
  )
}

function ProductUpdateScene() {
  return (
    <article className="landing-app-window landing-loop-card overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">What customers see inside Orbit Notes</p><p className="mt-1 text-[9px] text-muted-foreground">In-product update</p></div><BellRing className="h-4 w-4 text-primary" /></div>
      <div className="relative min-h-[390px] bg-[radial-gradient(circle_at_25%_15%,oklch(var(--primary)/0.14),transparent_42%),oklch(var(--muted)/0.28)] p-5 sm:p-7">
        <div className="max-w-sm">
          <p className="text-[10px] font-semibold text-muted-foreground">ORBIT NOTES</p>
          <h3 className="mt-3 text-2xl font-semibold">Your notes, in motion.</h3>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">A calm home for daily thinking and useful reminders.</p>
        </div>
        <div className="landing-app-window absolute bottom-5 right-5 w-[82%] max-w-sm overflow-hidden rounded-xl border bg-card shadow-[0_26px_70px_-28px_rgb(0_0_0/0.55)]">
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
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">What customers see on the public web</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">feedbacks.dev/p/orbit-notes</p></div><ExternalLink className="h-4 w-4 text-primary" /></div>
      <div className="min-h-[390px] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">O</span><div><h3 className="text-sm font-semibold">Orbit Notes feedback</h3><p className="mt-1 text-[9px] text-muted-foreground">Ideas, decisions, and shipped work</p></div></div></div><span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Submit idea</span></div>
        <div className="mt-5 flex gap-2 border-y py-3 text-[9px]"><span className="rounded-full bg-foreground px-3 py-1 font-semibold text-background">Top ideas</span><span className="rounded-full px-3 py-1 text-muted-foreground">Planned</span><span className="rounded-full px-3 py-1 text-muted-foreground">Shipped</span></div>
        <div className="divide-y">
          <BoardRow votes="38" title="Add a weekly review view" meta="Planned · 12 replies" active />
          <BoardRow votes="24" title="Pin notes to the top" meta="In progress · 6 replies" />
          <BoardRow votes="17" title="Notification schedules" meta="Shipped · 4 replies" />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/[0.055] p-3 text-[10px] leading-4"><MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span><strong>Official response:</strong> Weekly review is planned for the next release. Follow this idea to get the update.</span></div>
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
