import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BellRing,
  Bug,
  Camera,
  Check,
  ChevronUp,
  CircleDot,
  Clock3,
  ExternalLink,
  Flag,
  Globe2,
  Lightbulb,
  MessageSquareText,
  MonitorSmartphone,
  Paperclip,
  Rocket,
  Tag,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function LandingProductStories() {
  return (
    <>
      <section id="product" className="landing-journey landing-reveal border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-[1400px] px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-[2.75rem]">One feedback from your customer becomes work your team can act on.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">The customer stays inside your product. The useful context arrives automatically, and the next action lands where your team already works.</p>
          </div>

          <div className="landing-journey-grid mt-14 grid items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)_112px_minmax(0,1fr)]">
            <StoryStep number="01" title="Your customer sends feedback" note="A short message, without leaving your product.">
              <ProductCaptureScene />
            </StoryStep>
            <FlowConnector label="Context included" />
            <StoryStep number="02" title="You receive the full picture" note="Message, page, device, time, and screenshot together.">
              <FeedbackInboxScene />
            </StoryStep>
            <FlowConnector label="Ready to act" />
            <StoryStep number="03" title="The right tool gets the next action" note="Route it to GitHub, Slack, email, or a webhook.">
              <WorkflowScene />
            </StoryStep>
          </div>
        </div>
        <Image className="landing-section-mascot landing-mascot-journey" src="/mascots-v2/journey-runner.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 190px, 360px" aria-hidden="true" />
      </section>

      <section className="landing-context-section landing-reveal border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Your first reply can be useful instead of “which page were you on?”</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">The evidence arrives beside the message, so your team can reproduce the problem and respond without interrogating the customer.</p>
          </div>
          <div>
            <StoryWindowHeader title="Every report arrives with evidence" note="Captured automatically, with screenshots always optional." />
            <ContextEvidenceScene />
          </div>
        </div>
        <Image className="landing-section-mascot landing-mascot-context-v2" src="/mascots-v2/context-detective.png" alt="" width={1024} height={1536} sizes="(max-width: 767px) 150px, 230px" aria-hidden="true" />
      </section>

      <section className="landing-inbox-section landing-reveal border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Open your dashboard and know what deserves attention.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">New feedback is obvious, the important context is already attached, and a clear next action is always within reach.</p>
          </div>
          <div className="mx-auto mt-14 max-w-5xl">
            <StoryWindowHeader title="Signal first, noise second" note="The urgent report is selected, explained, and ready to move forward." />
            <TriageDashboardScene />
          </div>
          <Image className="landing-section-mascot landing-mascot-inbox" src="/mascots-v2/inbox-controller.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 220px, 400px" aria-hidden="true" />
        </div>
      </section>

      <section className="landing-close-loop landing-reveal relative overflow-hidden border-b py-20 sm:py-28">
        <div className="relative z-[2] mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Let users see what happened next.</h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">Publish a shipped update inside your product, or keep the decision visible on a public feedback board.</p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            <div>
              <StoryWindowHeader title="Tell customers what shipped" note="A concise update appears inside the product they already use." />
              <ProductUpdateScene />
            </div>
            <div>
              <StoryWindowHeader title="Keep decisions visible" note="Ideas, status, and official replies stay together in public." />
              <PublicBoardScene />
            </div>
          </div>
        </div>
        <Image className="landing-section-mascot landing-mascot-loop" src="/mascots-v2/loop-courier.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 210px, 370px" aria-hidden="true" />
      </section>
    </>
  )
}

function StoryStep({ number, title, note, children }: { number: string; title: string; note: string; children: ReactNode }) {
  return (
    <div className="landing-story-step min-w-0">
      <StoryWindowHeader number={number} title={title} note={note} />
      {children}
    </div>
  )
}

function StoryWindowHeader({ number, title, note }: { number?: string; title: string; note: string }) {
  return (
    <div className="landing-story-window-header flex items-start gap-3">
      {number ? <span className="landing-story-window-number flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums">{number}</span> : null}
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-5 tracking-[-0.02em] sm:text-lg sm:leading-6">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">{note}</p>
      </div>
    </div>
  )
}

function ProductCaptureScene() {
  return (
    <article className="landing-app-window landing-scene-card landing-story-window overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3">
        <span className="text-xs font-semibold">ACME App</span>
        <span className="text-[10px] text-muted-foreground">acme.app/settings</span>
      </div>
      <div className="landing-capture-stage relative min-h-[320px] overflow-hidden p-5">
        <div className="landing-capture-host max-w-[88%]">
          <p className="text-xs font-semibold text-muted-foreground">Notification schedule</p>
          <div className="mt-4 flex items-center justify-between rounded-xl border bg-background/80 p-4 text-xs">
            <span>Delivery time</span><span className="font-semibold">9:00 AM</span>
          </div>
        </div>
        <span className="landing-capture-scrim absolute inset-0" aria-hidden="true" />
        <div className="landing-app-window landing-capture-pop absolute bottom-4 right-4 z-10 w-[88%] max-w-[300px] overflow-hidden rounded-xl border bg-card shadow-[0_24px_65px_-24px_rgb(0_0_0/0.45)]">
          <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="text-xs font-semibold">Send feedback</span><span className="text-[10px] font-medium text-rose-500">Bug</span></div>
          <div className="landing-capture-compose p-4">
            <p className="rounded-lg border bg-background p-3 text-xs leading-5">My notification time resets after I save.</p>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><Camera className="h-3 w-3" />Screenshot</span><span className="landing-capture-send rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Send</span></div>
          </div>
          <div className="landing-capture-success absolute inset-x-0 bottom-0 top-[37px] flex flex-col items-center justify-center bg-card px-5 text-center" aria-hidden="true">
            <span className="landing-capture-success-mark flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-primary-foreground"><Check className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold">Feedback sent</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">No support portal. No lost context.</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function FlowConnector({ label }: { label: string }) {
  return (
    <div className="landing-flow-connector" aria-hidden="true">
      <span className="landing-flow-line" />
      <span className="landing-flow-pill"><span>{label}</span><ArrowRight className="h-4 w-4" /></span>
      <span className="landing-flow-line" />
    </div>
  )
}

function FeedbackInboxScene() {
  return (
    <article className="landing-app-window landing-scene-card landing-story-window overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3">
        <div><p className="text-xs font-semibold">ACME App inbox</p><p className="mt-0.5 text-[10px] text-muted-foreground">1 new report</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-300"><CircleDot className="h-3 w-3" />New</span>
      </div>
      <div className="landing-inbox-summary min-h-[320px] p-5">
        <div className="flex items-start gap-3 border-b pb-4">
          <Bug className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <div className="min-w-0"><p className="text-sm font-semibold leading-5">“My notification time resets after I save.”</p><p className="mt-1 text-xs text-muted-foreground">Bug · just now</p></div>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <ContextRow Icon={Globe2} label="Page" value="/settings/notifications" />
          <ContextRow Icon={MonitorSmartphone} label="Device" value="Chrome · macOS" />
          <ContextRow Icon={Paperclip} label="Attachment" value="Screenshot included" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-300"><Flag className="h-3.5 w-3.5" />High signal</span>
          <span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Review report</span>
        </div>
      </div>
    </article>
  )
}

function ContextRow({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="landing-context-row grid grid-cols-[18px_56px_minmax(0,1fr)] items-center gap-2 rounded-lg px-3 py-2.5 text-xs">
      <Icon className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{label}</span><span className="truncate text-right font-semibold">{value}</span>
    </div>
  )
}

function WorkflowScene() {
  const destinations = [
    { badge: 'GH', title: 'GitHub issue #184', meta: 'Created with the original context' },
    { badge: 'SL', title: '#product alert', meta: 'The team sees it immediately' },
  ]
  return (
    <article className="landing-app-window landing-scene-card landing-story-window overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="text-xs font-semibold">Connected workflows</span><span className="text-[10px] text-muted-foreground">Automatic</span></div>
      <div className="landing-workflow-stack flex min-h-[320px] flex-col justify-center p-5">
        <div className="landing-route-track space-y-3">
          {destinations.map((item, index) => (
            <div key={item.title} className="landing-route-card flex items-center gap-3 rounded-xl border bg-background p-3.5" style={{ animationDelay: `${index * 180}ms` }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-[10px] font-bold text-background">{item.badge}</span>
              <div className="min-w-0"><p className="truncate text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.meta}</p></div>
              <Check className="ml-auto h-4 w-4 text-emerald-500" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Webhook className="h-4 w-4" /></span>
          <div><p className="text-xs font-semibold">Or send it anywhere</p><p className="mt-1 text-[10px] text-muted-foreground">Email, Discord, or your own webhook</p></div>
        </div>
      </div>
    </article>
  )
}

function ContextEvidenceScene() {
  return (
    <article className="landing-app-window landing-evidence-window mt-5 overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-semibold"><Camera className="h-4 w-4 text-primary" />Report evidence</span><span className="text-[10px] text-muted-foreground">Captured automatically</span></div>
      <div className="grid md:grid-cols-[1.12fr_0.88fr]">
        <div className="landing-evidence-shot border-b p-5 md:border-b-0 md:border-r">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-[10px] font-semibold text-muted-foreground">ACME APP · NOTIFICATIONS</p>
            <div className="landing-evidence-highlight mt-4 rounded-lg border border-rose-400/40 bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs"><span>Delivery time</span><span className="font-semibold">9:00 AM</span></div>
              <p className="mt-3 rounded-md bg-rose-500/10 p-2.5 text-[10px] font-medium text-rose-600 dark:text-rose-300">Resets to 8:00 AM after save</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">The screenshot shows the problem before anyone asks for reproduction steps.</p>
        </div>
        <div className="flex flex-col justify-center p-5">
          <ContextRow Icon={Globe2} label="Page" value="/settings/notifications" />
          <ContextRow Icon={MonitorSmartphone} label="Device" value="Chrome · macOS" />
          <ContextRow Icon={Clock3} label="Time" value="Just now" />
          <ContextRow Icon={Tag} label="Type" value="Bug" />
          <div className="mt-3 flex items-center gap-2 border-t pt-4 text-xs font-semibold"><Paperclip className="h-4 w-4 text-primary" />Screenshot attached to the same report</div>
        </div>
      </div>
    </article>
  )
}

function TriageDashboardScene() {
  const rows = [
    { title: 'Notification time resets after save', meta: 'Bug · just now', tone: 'bg-rose-400', active: true },
    { title: 'Keyboard shortcut for capture', meta: 'Idea · 42m', tone: 'bg-sky-400' },
    { title: 'The new editor feels faster', meta: 'Praise · 3h', tone: 'bg-emerald-400' },
  ]
  return (
    <figure className="landing-app-window landing-triage-dashboard relative mt-5 overflow-hidden rounded-2xl border text-zinc-100">
      <div className="landing-window-titlebar flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-300 text-[10px] font-black text-zinc-950">f.</span><p className="text-xs font-semibold">Feedback inbox</p></div>
        <span className="inline-flex items-center gap-2 text-[10px] text-zinc-400"><CircleDot className="h-3 w-3 text-lime-300" />3 reports</span>
      </div>
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="landing-triage-list border-b border-white/10 p-3 md:border-b-0 md:border-r sm:p-4">
          <p className="px-2 pb-3 text-xs font-semibold text-zinc-300">Newest feedback</p>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.title} className={`landing-triage-compact-row flex items-start gap-3 rounded-lg px-3 py-3 ${row.active ? 'is-active' : ''}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${row.tone}`} />
                <div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-100">{row.title}</p><p className="mt-1 text-[10px] text-zinc-500">{row.meta}</p></div>
                {row.active ? <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-lime-300" /> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="landing-triage-focus p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold"><span className="rounded-md bg-rose-400/15 px-2 py-1 text-rose-300">Bug</span><span className="rounded-md bg-amber-300/10 px-2 py-1 text-amber-200">High priority</span></div>
          <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">Notification time resets after save</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">“I chose 9:00 AM, but the page shows 8:00 AM when I return.”</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <span className="rounded-lg bg-white/[0.045] px-3 py-2 text-[10px] text-zinc-400">Page <strong className="ml-1 text-zinc-200">/settings/notifications</strong></span>
            <span className="rounded-lg bg-white/[0.045] px-3 py-2 text-[10px] text-zinc-400">Device <strong className="ml-1 text-zinc-200">Chrome · macOS</strong></span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5"><span className="rounded-md bg-lime-300 px-3 py-2 text-[10px] font-semibold text-zinc-950">Mark planned</span><span className="rounded-md border border-white/15 px-3 py-2 text-[10px] font-semibold text-zinc-200">Send to GitHub</span></div>
        </div>
      </div>
    </figure>
  )
}

function ProductUpdateScene() {
  return (
    <article className="landing-app-window landing-loop-card overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><span className="text-xs font-semibold">ACME App</span><span className="landing-update-bell"><BellRing className="h-4 w-4 text-primary" /></span></div>
      <div className="landing-update-stage relative min-h-[340px] p-5 sm:p-7">
        <div className="relative z-0 max-w-sm"><p className="text-xs font-semibold text-muted-foreground">Notifications</p><h3 className="mt-3 text-2xl font-semibold">Your schedule is saved.</h3></div>
        <div className="landing-update-scrim absolute inset-0 z-[1]" aria-hidden="true" />
        <div className="landing-app-window landing-update-pop absolute bottom-5 right-5 z-[2] w-[84%] max-w-sm overflow-hidden rounded-xl border bg-card">
          <div className="landing-window-titlebar flex items-center justify-between border-b px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-semibold"><Rocket className="h-3.5 w-3.5 text-primary" />What&apos;s new</span><span className="text-[10px] text-muted-foreground">Just shipped</span></div>
          <div className="p-4"><span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Shipped</span><h4 className="mt-2 text-base font-semibold">Notification schedules now save instantly</h4><p className="mt-2 text-xs leading-5 text-muted-foreground">Your chosen time now stays exactly where you put it, on every device.</p><p className="mt-4 text-[10px] font-semibold text-primary">Thanks to everyone who reported this.</p></div>
        </div>
      </div>
    </article>
  )
}

function PublicBoardScene() {
  return (
    <article className="landing-app-window landing-loop-card overflow-hidden rounded-2xl border bg-card">
      <div className="landing-window-titlebar flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">ACME App feedback</p><p className="mt-1 text-[10px] text-muted-foreground">feedbacks.dev/p/acme-app</p></div><ExternalLink className="h-4 w-4 text-primary" /></div>
      <div className="min-h-[340px] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">Ideas and decisions</p><span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Submit idea</span></div>
        <div className="mt-5 divide-y">
          <BoardRow votes="38" title="Add a weekly review view" meta="Planned · Official reply" active />
          <BoardRow votes="17" title="Notification schedules" meta="Shipped · 4 replies" />
        </div>
        <div className="landing-board-response mt-4 flex items-start gap-2 rounded-lg bg-primary/[0.07] p-3 text-[10px] leading-5"><MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span><strong>Official response:</strong> Weekly review is planned for the next release.</span></div>
      </div>
    </article>
  )
}

function BoardRow({ votes, title, meta, active = false }: { votes: string; title: string; meta: string; active?: boolean }) {
  return (
    <div className={`landing-board-row flex items-center gap-3 py-4 ${active ? 'is-active' : ''}`}>
      <span className="landing-board-vote flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border bg-background"><ChevronUp className="h-3 w-3 text-primary" /><span className="text-[10px] font-semibold">{votes}</span></span>
      <div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] text-muted-foreground">{meta}</p></div>
      {active ? <Lightbulb className="ml-auto h-4 w-4 text-primary" /> : null}
    </div>
  )
}
