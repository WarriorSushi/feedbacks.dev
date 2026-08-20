import Image from 'next/image'
import {
  Bug,
  Camera,
  CircleDot,
  Globe2,
  MessageSquareText,
  MonitorSmartphone,
  Paperclip,
  Tag,
} from 'lucide-react'

export function LandingProductStories() {
  return (
    <>
      <section id="product" className="landing-feature landing-feature-capture landing-reveal border-b">
        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.76fr_1.24fr] lg:gap-20">
          <FeatureCopy
            number="01"
            title="Feedback happens inside the product."
            body="Your user stays on the page where something went wrong, opens one small form, and tells ACME Corp what happened."
            foot="No support portal. No context lost between tabs."
          />
          <CaptureScene />
        </div>
      </section>

      <section className="landing-feature landing-feature-routing landing-reveal border-b bg-[oklch(0.105_0.012_132)] text-[oklch(0.965_0.007_112)]">
        <div className="mx-auto max-w-[1500px] px-0 py-20 sm:px-6 sm:py-28">
          <div className="px-5 sm:px-0">
            <FeatureCopy
              number="02"
              title="World-class feedback. One dashboard. Fewer tabs plotting against you."
              body="Collect feedback, triage the useful bits, publish updates, manage public boards, and route work to GitHub, Slack, email, or a webhook. ACME Corp stays organized. Customers stay in the loop."
              foot="Everyone is happy. Your browser has stopped negotiating for more RAM."
              inverse
            />
          </div>
          <div className="landing-routing-image relative mt-12 overflow-hidden border-y border-white/10 sm:rounded-2xl sm:border">
            <Image
              src="/mascot_withlaptop_connected_to_everything.webp"
              alt="The feedbacks.dev mascot managing feedback, product updates, public boards, and connected tools from one dashboard"
              width={1792}
              height={1024}
              className="h-auto min-h-[360px] w-full object-cover object-[58%_center] sm:min-h-0 sm:object-center"
              sizes="(max-width: 1500px) 100vw, 1500px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.01_132/0.7)] via-transparent to-transparent" aria-hidden="true" />
            <p className="absolute bottom-5 left-5 max-w-xs text-xs leading-5 text-zinc-300 sm:bottom-7 sm:left-7">
              One dashboard, doing a suspiciously reasonable amount of work.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-feature landing-feature-context landing-reveal border-b">
        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.22fr_0.78fr] lg:gap-20">
          <ContextScene />
          <FeatureCopy
            number="03"
            title="The useful context arrives with the sentence."
            body="The report already knows the page, browser, rating, and optional screenshot. Your team starts with evidence instead of a follow-up email."
            foot="One report, ready to investigate."
          />
        </div>
      </section>

      <section className="landing-feature landing-feature-triage landing-reveal border-b">
        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.76fr_1.24fr] lg:gap-20">
          <FeatureCopy
            number="04"
            title="Turn a noisy inbox into the next decision."
            body="Filter new reports, add the tags your team actually uses, and move the important ones from new to planned without introducing Jira-scale ceremony."
            foot="Bugs, ideas, and praise stay distinct without becoming three different tools."
          />
          <TriageScene />
        </div>
      </section>

      <section className="landing-feature landing-feature-updates landing-reveal border-b">
        <div className="mx-auto grid min-h-[820px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
          <div className="landing-update-image overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.12_0.012_132)] shadow-[0_38px_95px_-45px_oklch(0.18_0.08_132/0.7)]">
            <Image
              src="/feedbacks-close-the-loop-v1.png"
              alt="The feedbacks.dev mascot carrying a shipped product update back into ACME Corp"
              width={1536}
              height={1024}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          </div>
          <FeatureCopy
            number="05"
            title="Show users that their feedback shipped."
            body="Publish a concise product update from the same dashboard. The embed already in ACME Corp shows it inside the product, without another installation."
            foot="A report becomes visible progress, not a closed ticket nobody sees."
          />
        </div>
      </section>

      <section className="landing-feature landing-feature-board landing-reveal border-b">
        <div className="mx-auto grid min-h-[780px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.74fr_1.26fr] lg:gap-20">
          <FeatureCopy
            number="06"
            title="Give good ideas a public place to gather."
            body="Run a focused feedback board where users can post, vote, follow a status, and read the official response from ACME Corp."
            foot="Useful transparency, without turning product decisions into a popularity contest."
          />
          <PublicBoardScene />
        </div>
      </section>
    </>
  )
}

function FeatureCopy({
  number,
  title,
  body,
  foot,
  inverse = false,
}: {
  number: string
  title: string
  body: string
  foot: string
  inverse?: boolean
}) {
  return (
    <div className="landing-feature-copy relative z-10 max-w-xl">
      <span className={inverse ? 'text-lime-300' : 'text-primary'}>{number}</span>
      <h2 className="mt-5 text-4xl font-semibold leading-[1.01] tracking-[-0.052em] sm:text-5xl">{title}</h2>
      <p className={inverse ? 'mt-6 text-base leading-7 text-zinc-300' : 'mt-6 text-base leading-7 text-muted-foreground'}>{body}</p>
      <p className={inverse ? 'mt-7 border-t border-white/15 pt-5 text-xs leading-5 text-zinc-400' : 'mt-7 border-t pt-5 text-xs leading-5 text-muted-foreground'}>{foot}</p>
    </div>
  )
}

function CaptureScene() {
  return (
    <figure className="landing-capture-scene relative mx-auto w-full max-w-3xl pb-14 sm:pb-10">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-float)]">
        <div className="flex h-12 items-center gap-2 border-b px-4 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="ml-3">acme.test/reports/export</span>
        </div>
        <div className="grid min-h-[420px] grid-cols-[86px_1fr] sm:grid-cols-[128px_1fr]">
          <div className="border-r bg-muted/25 p-4">
            <span className="block h-2 w-10 rounded-full bg-foreground/15" />
            <div className="mt-8 space-y-4"><span className="block h-8 bg-primary/10" /><span className="block h-8 bg-foreground/[0.04]" /><span className="block h-8 bg-foreground/[0.04]" /></div>
          </div>
          <div className="p-5 sm:p-8">
            <p className="text-xs font-semibold">Export report</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><span className="h-20 rounded-lg border bg-background" /><span className="h-20 rounded-lg border bg-background" /><span className="h-20 rounded-lg border bg-background" /></div>
            <div className="mt-5 h-28 rounded-lg border bg-muted/20" />
          </div>
        </div>
      </div>

      <div className="landing-capture-form absolute -bottom-2 right-2 w-[84%] max-w-sm overflow-hidden rounded-xl border bg-card shadow-[0_28px_80px_-28px_oklch(0.18_0.05_132/0.48)] sm:-bottom-8 sm:right-6">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-xs font-semibold">Tell ACME Corp</span>
          <span className="text-[9px] text-muted-foreground">Bug report</span>
        </div>
        <div className="p-4">
          <p className="min-h-20 rounded-lg border bg-background p-3 text-xs leading-5 text-muted-foreground">Export keeps spinning after I choose the last 90 days.</p>
          <div className="mt-3 flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><Camera className="h-3 w-3" />Add screenshot</span><span className="rounded-md bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Send feedback</span></div>
        </div>
      </div>

      <Image
        src="/mascot-feedback-press-v1.png"
        alt="feedbacks.dev mascot pressing a feedback button while holding a message"
        width={1214}
        height={1295}
        className="landing-capture-mascot absolute -bottom-12 -left-8 z-[3] h-auto w-36 object-contain drop-shadow-[0_22px_24px_oklch(0.12_0.01_132/0.28)] sm:-bottom-16 sm:-left-20 sm:w-52"
      />
    </figure>
  )
}

function ContextScene() {
  return (
    <div className="landing-context-wrap relative mx-auto w-full max-w-3xl pb-20 sm:pb-14">
    <figure className="landing-context-scene overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.15_0.012_132)] text-[oklch(0.965_0.007_112)] shadow-[0_34px_90px_-40px_oklch(0.18_0.08_132/0.7)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-xs font-semibold">ACME Corp</p><p className="mt-1 text-[9px] text-zinc-500">Feedback inbox</p></div><span className="text-[9px] text-zinc-500">Received just now</span></div>
      <div className="grid md:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-5 sm:p-7 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-rose-300"><Bug className="h-3.5 w-3.5" />Bug report</div>
          <h3 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">Export freezes after I choose the last 90 days.</h3>
          <div className="mt-7 overflow-hidden rounded-xl border border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[10px] text-zinc-300"><Camera className="h-3.5 w-3.5 text-lime-300" />Screenshot</div>
            <div className="relative h-44 bg-[oklch(0.94_0.02_132)] p-4"><span className="block h-2 w-24 rounded-full bg-[oklch(0.72_0.02_132)]" /><div className="mt-5 grid grid-cols-3 gap-3"><span className="h-20 rounded-lg border border-[oklch(0.84_0.02_132)]" /><span className="h-20 rounded-lg border border-[oklch(0.84_0.02_132)]" /><span className="h-20 rounded-lg border border-[oklch(0.84_0.02_132)]" /></div><span className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-lg border border-[oklch(0.78_0.02_132)] bg-[oklch(0.985_0.006_132)] px-4 py-3 text-[10px] font-semibold text-[oklch(0.25_0.02_132)] shadow-lg">Preparing export…</span></div>
          </div>
        </div>
        <dl className="landing-context-rail divide-y divide-white/10 px-5 sm:px-6">
          <ContextDatum label="Page"><span className="font-mono">/reports/export</span></ContextDatum>
          <ContextDatum label="Browser"><span className="inline-flex items-center gap-2"><MonitorSmartphone className="h-3.5 w-3.5 text-lime-300" />Edge on Windows</span></ContextDatum>
          <ContextDatum label="Rating"><span className="tracking-[0.18em] text-amber-300">★★☆☆☆</span></ContextDatum>
          <ContextDatum label="Attachment"><span className="inline-flex items-center gap-2"><Paperclip className="h-3.5 w-3.5 text-lime-300" />Screenshot included</span></ContextDatum>
        </dl>
      </div>
    </figure>
      <Image
        src="/mascot-context-investigator-v1.png"
        alt="feedbacks.dev mascot inspecting the page, browser, and rating attached to a report"
        width={1209}
        height={1301}
        className="landing-context-mascot absolute -bottom-10 -right-7 z-[3] h-auto w-36 object-contain drop-shadow-[0_24px_26px_oklch(0.08_0.02_132/0.36)] sm:-bottom-14 sm:-right-12 sm:w-52"
      />
    </div>
  )
}

function ContextDatum({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="py-6"><dt className="text-[9px] text-zinc-500">{label}</dt><dd className="mt-2 text-xs text-zinc-200">{children}</dd></div>
}

function TriageScene() {
  const rows = [
    ['Export freezes after I choose…', 'Bug · just now', 'New'],
    ['Saved report views would help', 'Idea · 2h', 'Planned'],
    ['The new report builder is fast', 'Praise · yesterday', 'Reviewed'],
  ] as const
  return (
    <div className="landing-triage-wrap relative mx-auto w-full max-w-3xl pb-24 sm:pb-16">
    <figure className="landing-triage-scene overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between border-b px-5 py-4"><div><p className="text-xs font-semibold">ACME Corp inbox</p><p className="mt-1 text-[9px] text-muted-foreground">12 unread reports</p></div><span className="inline-flex items-center gap-2 text-[10px] text-primary"><CircleDot className="h-3 w-3" />Live</span></div>
      <div className="grid min-h-[430px] md:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b md:border-b-0 md:border-r">
          {rows.map(([title, meta, status], index) => <div key={title} className={`landing-triage-row border-b px-5 py-5 last:border-b-0 ${index === 0 ? 'is-selected' : ''}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-rose-400' : index === 1 ? 'bg-sky-400' : 'bg-amber-300'}`} /><div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="mt-1 text-[9px] text-muted-foreground">{meta}</p></div><span className="ml-auto text-[9px] text-muted-foreground">{status}</span></div></div>)}
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap gap-2 text-[9px]"><span className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-600 dark:text-rose-300">Bug</span><span className="rounded-md bg-primary/10 px-2 py-1 text-primary">Exports</span><span className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">High signal</span></div>
          <h3 className="mt-5 text-xl font-semibold leading-7">Export freezes after I choose the last 90 days.</h3>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">The spinner stays forever. Refreshing brings the report back, but the download never starts.</p>
          <dl className="mt-6 divide-y border-y text-xs"><div className="flex items-center justify-between py-3"><dt className="text-muted-foreground">Status</dt><dd className="font-medium">Planned</dd></div><div className="flex items-center justify-between py-3"><dt className="text-muted-foreground">Owner</dt><dd className="font-medium">Maya</dd></div><div className="flex items-center justify-between py-3"><dt className="text-muted-foreground">Destination</dt><dd className="font-medium">GitHub issue #248</dd></div></dl>
          <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground"><Tag className="h-3.5 w-3.5 text-primary" />Exports · Reliability · Pro</div>
        </div>
      </div>
    </figure>
      <Image
        src="/mascot-triage-controller-v1.png"
        alt="feedbacks.dev mascot sorting feedback into clear triage lanes"
        width={1493}
        height={1053}
        className="landing-triage-mascot absolute -bottom-8 -right-3 z-[3] h-auto w-52 object-contain drop-shadow-[0_24px_28px_oklch(0.12_0.02_132/0.3)] sm:-bottom-16 sm:-right-10 sm:w-72"
      />
    </div>
  )
}

function PublicBoardScene() {
  return (
    <figure className="landing-board-scene relative mx-auto w-full max-w-3xl pb-14 sm:pb-8">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-between border-b px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground">A</span><div><p className="text-xs font-semibold">ACME Corp ideas</p><p className="mt-0.5 text-[9px] text-muted-foreground">Public feedback board</p></div></div><Globe2 className="h-4 w-4 text-primary" /></div>
        <div className="grid md:grid-cols-[1.15fr_0.85fr]">
          <div className="divide-y border-b md:border-b-0 md:border-r">
            <BoardRow votes="24" title="Add saved report views" meta="Planned · 8 replies" active />
            <BoardRow votes="11" title="Faster CSV exports" meta="Shipped · 4 replies" />
            <BoardRow votes="8" title="Share reports with a link" meta="Under review · 2 replies" />
          </div>
          <div className="bg-muted/20 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-primary"><MessageSquareText className="h-3.5 w-3.5" />Official response</div>
            <p className="mt-4 text-sm font-semibold leading-6">Saved views are planned for the next reporting update.</p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">We are starting with filters, columns, and date ranges. Everyone following this idea will see the launch note.</p>
            <div className="mt-6 border-t pt-4 text-[9px] text-muted-foreground">Posted by ACME Corp · 12 minutes ago</div>
          </div>
        </div>
      </div>
      <Image
        src="/mascot-public-board-v1.png"
        alt="feedbacks.dev mascot curating ideas on ACME Corp's public feedback board"
        width={1128}
        height={1394}
        className="landing-board-mascot absolute -bottom-12 -right-4 z-[3] h-auto w-36 object-contain drop-shadow-[0_24px_26px_oklch(0.12_0.02_132/0.26)] sm:-bottom-20 sm:-right-20 sm:w-56"
      />
      <div className="absolute bottom-3 right-28 z-[4] rounded-lg border bg-card px-3 py-2 text-[10px] font-medium shadow-[var(--shadow-card)] sm:bottom-0 sm:right-28">Good ideas, one visible home.</div>
    </figure>
  )
}

function BoardRow({ votes, title, meta, active = false }: { votes: string; title: string; meta: string; active?: boolean }) {
  return <div className={`landing-board-row flex items-center gap-4 px-5 py-5 sm:px-6 ${active ? 'is-active' : ''}`}><div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border bg-background"><span className="text-xs font-semibold">{votes}</span><span className="text-[8px] text-muted-foreground">votes</span></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{title}</p><p className="mt-1 text-[9px] text-muted-foreground">{meta}</p></div></div>
}
