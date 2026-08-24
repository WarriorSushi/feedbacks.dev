'use client'

import type { ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  ClipboardPenLine,
  Code2,
  Copy,
  Eye,
  Filter,
  Globe,
  House,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Monitor,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type DemoScreen = 'dashboard' | 'form' | 'install' | 'inbox' | 'updates' | 'board' | 'integrations'

const sidebarTargets = new Set([
  '[data-tour="nav-dashboard"]',
  '[data-tour="project-switcher"]',
  '[data-tour="theme-switcher"]',
  '[data-tour="nav-updates"]',
  '[data-tour="nav-boards"]',
])

function screenForTarget(target: string): DemoScreen {
  if (target.includes('widget-')) return 'form'
  if (target.includes('install-')) return 'install'
  if (target.includes('inbox-')) return 'inbox'
  if (target.includes('nav-updates')) return 'updates'
  if (target.includes('nav-boards')) return 'board'
  if (target.includes('integration-')) return 'integrations'
  return 'dashboard'
}

const navGroups: Array<{
  label: string
  items: Array<{ label: string; icon: LucideIcon; target?: string; screen?: DemoScreen }>
}> = [
  {
    label: '',
    items: [{ label: 'Dashboard', icon: House, target: 'nav-dashboard', screen: 'dashboard' as const }],
  },
  {
    label: 'Set up project',
    items: [
      { label: 'Project overview', icon: LayoutDashboard },
      { label: 'Install & test', icon: Code2, screen: 'install' as const },
      { label: 'Customize form', icon: ClipboardPenLine, screen: 'form' as const },
    ],
  },
  {
    label: 'Collect & review',
    items: [{ label: 'Feedback inbox', icon: Inbox, screen: 'inbox' as const }],
  },
  {
    label: 'Share with users',
    items: [
      { label: 'Updates for users', icon: Megaphone, target: 'nav-updates', screen: 'updates' as const },
      { label: 'My public page', icon: Globe, target: 'nav-boards', screen: 'board' as const },
    ],
  },
  {
    label: 'Connect',
    items: [
      { label: 'Integrations', icon: Webhook, screen: 'integrations' as const },
      { label: 'API & MCP', icon: Code2 },
    ],
  },
]

function DemoSidebar({ screen }: { screen: DemoScreen }) {
  return (
    <aside className="flex h-full w-full flex-col border-r bg-sidebar md:w-72">
      <div className="flex h-14 items-center border-b px-4 text-sm font-semibold">
        <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">f</span>
        feedbacks.dev
      </div>
      <div className="border-b p-2" data-tour="project-switcher">
        <div className="flex min-h-11 items-center justify-between rounded-lg border bg-card px-2.5 py-1.5 text-[13px] shadow-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10" aria-hidden="true">✦</span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Practice project</span>
              <span className="block truncate font-medium">Acme Studio</span>
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        <div className="space-y-2">
          {navGroups.map((group) => (
            <div key={group.label || 'home'} className="space-y-px">
              {group.label ? <p className="mb-0.5 h-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">{group.label}</p> : null}
              {group.items.map((item) => {
                const Icon = item.icon
                const selected = item.screen === screen
                return (
                  <div
                    key={item.label}
                    data-tour={item.target}
                    className={cn(
                      'flex min-h-10 items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium md:min-h-8',
                      selected ? 'bg-surface-selected text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.label === 'Feedback inbox' ? <span className="ml-auto rounded-full bg-foreground px-1.5 text-[10px] text-background">6</span> : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </nav>
      <div className="flex items-center gap-1.5 border-t p-1.5">
        <div data-tour="theme-switcher" className="flex min-w-0 flex-1 items-center rounded-md border bg-card p-1">
          <span className="flex h-7 flex-1 items-center justify-center rounded bg-surface-selected text-primary"><Monitor className="h-3.5 w-3.5" /></span>
          <span className="flex h-7 flex-1 items-center justify-center text-muted-foreground"><Palette className="h-3.5 w-3.5" /></span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">A</span>
      </div>
    </aside>
  )
}

function PracticeHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Instant practice workspace
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="w-fit rounded-md border bg-surface-inset px-2.5 py-1 text-xs text-muted-foreground">Sample data · nothing is saved</span>
    </header>
  )
}

function DashboardDemo() {
  return (
    <>
      <PracticeHeader title="Good morning, Alex" description="Here is the complete feedback loop for Acme Studio." />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Feedback this week', '24', '+18%'],
          ['Needs review', '6', '2 high signal'],
          ['Updates viewed', '81%', '247 customers'],
        ].map(([label, value, detail]) => (
          <section key={label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-primary">{detail}</p>
          </section>
        ))}
      </div>
      <section className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-primary/25 bg-card p-4 shadow-sm">
        <div data-tour="dashboard-capabilities">
          <h2 className="text-sm font-semibold">Your first complete feedback loop</h2>
          <p className="mt-1 text-xs text-muted-foreground">Customize, install, collect, triage, and close the loop.</p>
        </div>
        <span className="flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">Continue setup</span>
      </section>
    </>
  )
}

function SettingBlock({ target, title, children }: { target: string; title: string; children: ReactNode }) {
  return (
    <section data-tour={target} className="rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function FormDemo() {
  return (
    <>
      <PracticeHeader title="Customize form" description="Start with a useful default, then change only what your product needs." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="space-y-3">
          <SettingBlock target="widget-placement" title="Placement">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['Floating', 'Custom trigger', 'Inline'].map((label, index) => <span key={label} className={cn('rounded-md border px-2 py-2 text-center', index === 0 && 'border-primary bg-primary/[0.06] text-primary')}>{label}</span>)}
            </div>
          </SettingBlock>
          <SettingBlock target="widget-appearance" title="Launcher appearance">
            <div className="flex items-center gap-3 text-xs"><span className="h-8 w-8 rounded-md bg-primary" /><span className="flex-1 rounded-md border px-3 py-2">Send feedback</span><span className="rounded-md border px-3 py-2">Bottom right</span></div>
          </SettingBlock>
          <SettingBlock target="widget-content" title="Form content">
            <div className="space-y-2 text-xs"><div className="rounded-md border px-3 py-2">Help us improve</div><div className="rounded-md border px-3 py-2 text-muted-foreground">What happened, and what did you expect?</div></div>
          </SettingBlock>
          <SettingBlock target="widget-protection" title="Optional fields and protection">
            <div className="flex flex-wrap gap-2 text-xs">{['Type', 'Rating', 'Screenshot', 'Email', 'Human check'].map((label, index) => <span key={label} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5"><span className={cn('h-3.5 w-3.5 rounded-sm border', index < 3 && 'border-primary bg-primary text-primary-foreground')} >{index < 3 ? <Check className="h-3 w-3" /> : null}</span>{label}</span>)}</div>
          </SettingBlock>
        </div>
        <section data-tour="widget-preview" className="h-fit rounded-lg border bg-card p-4 shadow-sm lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Live preview</h2><span className="text-xs text-muted-foreground">Mobile</span></div>
          <div className="mx-auto max-w-xs rounded-xl border bg-surface-inset p-4">
            <div className="rounded-lg border bg-card p-4 shadow-md">
              <MessageSquareText className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">Help us improve</h3>
              <div className="mt-3 h-20 rounded-md border bg-background p-2 text-xs text-muted-foreground">What happened, and what did you expect?</div>
              <div className="mt-3 flex h-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">Send feedback</div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function InstallDemo() {
  return (
    <>
      <PracticeHeader title="Install & test" description="Add one stable embed to your shared app shell, then verify one real submission." />
      <section data-tour="install-platforms" className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Choose your platform</h2>
        <div className="mt-3 flex flex-wrap gap-1 rounded-md border bg-surface-inset p-1 text-xs">
          {['Website', 'WordPress', 'React', 'Next.js', 'Vue'].map((label, index) => <span key={label} className={cn('rounded px-3 py-2', index === 0 ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground')}>{label}</span>)}
        </div>
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3"><div data-tour="install-code"><h2 className="text-sm font-semibold">Website embed</h2><p className="mt-0.5 text-xs text-muted-foreground">Paste before the closing body tag.</p></div><span className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Copy className="h-3.5 w-3.5" /> Copy</span></div>
        <pre className="overflow-hidden bg-zinc-950 p-4 text-xs leading-6 text-zinc-200"><code>{'<script\n  src="https://app.feedbacks.dev/widget/latest.js"\n  data-project="pk_demo_acme"\n  defer\n></script>'}</code></pre>
        <div className="flex items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> This practice key is an example and cannot submit data.</div>
      </section>
    </>
  )
}

function InboxDemo() {
  const rows = [
    ['Checkout button disappears on mobile', 'Bug', 'High signal', '2m'],
    ['A keyboard shortcut for search would help', 'Idea', 'Onboarding', '18m'],
    ['The new import flow is much clearer', 'Praise', 'Import', '1h'],
  ]
  return (
    <>
      <PracticeHeader title="Feedback inbox" description="Find the useful signal, inspect its context, then choose the next workflow state." />
      <section data-tour="inbox-filters" className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="flex min-w-52 flex-1 items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search feedback</span>{['Unread 6', 'New', 'Bugs', 'This week'].map((label, index) => <span key={label} className={cn('flex items-center gap-1.5 rounded-md border px-3 py-2', index === 0 && 'border-primary bg-primary/[0.06] text-primary')}>{index === 0 ? <Filter className="h-3.5 w-3.5" /> : null}{label}</span>)}</div>
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
        {rows.map(([message, type, tag, time], index) => (
          <div key={message} data-tour={index === 0 ? 'inbox-list' : undefined} className={cn('flex items-start gap-3 px-4 py-3', index > 0 && 'border-t')}>
            <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', index === 0 ? 'bg-primary' : 'bg-muted')} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{message}</p><div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span>{type}</span><span>·</span><span>{tag}</span><span>·</span><span>Chrome on Android</span></div></div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 5 · {time}</div>
          </div>
        ))}
      </section>
    </>
  )
}

function UpdatesDemo() {
  return (
    <>
      <PracticeHeader title="Updates for users" description="Publish concise customer outcomes when feedback turns into shipped work." />
      <div className="flex justify-end"><span className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> New update</span></div>
      <section className="mt-3 overflow-hidden rounded-lg border bg-card shadow-sm">
        {[
          ['Faster CSV imports', 'Published', '247 views', 'Today'],
          ['Mobile checkout fixes', 'Draft', 'Not visible', 'Yesterday'],
          ['Keyboard-first search', 'Published', '183 views', 'Aug 19'],
        ].map((row, index) => <div key={row[0]} className={cn('flex items-center gap-4 px-4 py-3', index > 0 && 'border-t')}><Megaphone className="h-4 w-4 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{row[0]}</p><p className="mt-1 text-xs text-muted-foreground">{row[1]} · {row[2]}</p></div><span className="text-xs text-muted-foreground">{row[3]}</span></div>)}
      </section>
    </>
  )
}

function BoardDemo() {
  return (
    <>
      <PracticeHeader title="My public page" description="Give customers one focused place to submit, browse, and vote on shared demand." />
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-semibold text-primary">acme.feedbacks.dev</span><h2 className="mt-1 text-lg font-semibold">Help shape Acme Studio</h2><p className="mt-1 text-sm text-muted-foreground">Vote on ideas and follow what we are building.</p></div><span className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs"><Eye className="h-3.5 w-3.5" /> Preview</span></div>
        <div className="mt-5 border-t">
          {['Offline project access', 'Figma comment import', 'Team-level permissions'].map((title, index) => <div key={title} className="flex items-center gap-3 border-b py-3"><span className="flex w-10 flex-col items-center rounded-md border py-1 text-[10px]"><span className="font-semibold">{42 - index * 9}</span>votes</span><div className="flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{index === 0 ? 'In progress' : 'Under review'} · {3 + index} replies</p></div></div>)}
        </div>
      </section>
    </>
  )
}

function IntegrationsDemo() {
  return (
    <>
      <PracticeHeader title="Integrations" description="Route high-signal feedback into the workflow your team already watches." />
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div data-tour="integration-endpoint" className="flex items-center gap-3 border-b px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"><Webhook className="h-4 w-4 text-primary" /></span><div className="flex-1"><h2 className="text-sm font-semibold">Add a destination</h2><p className="mt-0.5 text-xs text-muted-foreground">Save it, send a test, then check delivery history.</p></div><ChevronDown className="h-4 w-4 text-muted-foreground" /></div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {['Slack', 'Discord', 'GitHub Issues', 'Generic webhook'].map((label) => <div key={label} className="rounded-md border p-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-inset"><Webhook className="h-4 w-4" /></span><p className="mt-3 text-xs font-semibold">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">Not connected</p></div>)}
        </div>
      </section>
    </>
  )
}

function DemoContent({ screen }: { screen: DemoScreen }) {
  if (screen === 'form') return <FormDemo />
  if (screen === 'install') return <InstallDemo />
  if (screen === 'inbox') return <InboxDemo />
  if (screen === 'updates') return <UpdatesDemo />
  if (screen === 'board') return <BoardDemo />
  if (screen === 'integrations') return <IntegrationsDemo />
  return <DashboardDemo />
}

export function ProductTourDemo({ activeTarget }: { activeTarget: string }) {
  const screen = screenForTarget(activeTarget)
  const sidebarStep = sidebarTargets.has(activeTarget)

  return (
    <div data-tour-demo-root className="pointer-events-none fixed inset-0 flex overflow-hidden bg-background text-foreground" aria-hidden="true">
      <div className={cn('h-full w-[min(18rem,78vw)] shrink-0 md:block md:w-72', sidebarStep ? 'block' : 'hidden')}>
        <DemoSidebar screen={screen} />
      </div>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 md:px-8 md:py-7">
          <DemoContent screen={screen} />
        </div>
      </main>
    </div>
  )
}
