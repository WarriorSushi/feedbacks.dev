'use client'

import type { ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  ClipboardPenLine,
  Code2,
  Copy,
  Eye,
  ExternalLink,
  Globe,
  House,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Monitor,
  MousePointerClick,
  PanelTop,
  Palette,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionPanel } from '@/components/ui/workspace-shell'

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

function PracticeHeader({
  eyebrow = 'Acme Studio',
  title,
  description,
  meta,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  meta?: ReactNode
  action?: ReactNode
}) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      meta={(
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-md font-medium text-muted-foreground">Practice workspace</Badge>
          <span className="text-xs text-muted-foreground">Sample data, nothing is saved</span>
          {meta}
        </div>
      )}
      action={action}
    />
  )
}

function DashboardDemo() {
  return (
    <div className="space-y-5">
      <PracticeHeader
        eyebrow="Dashboard"
        title="Good morning"
        description="6 unread items need review."
        meta={<span className="rounded border bg-card px-2 py-1 text-xs font-medium text-foreground">Acme Studio</span>}
        action={<div className="flex gap-2"><Button variant="outline" size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New project</Button><Button size="sm"><Inbox className="mr-1.5 h-3.5 w-3.5" />Inbox (6)</Button></div>}
      />
      <div className="grid overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)] sm:grid-cols-3">
        {[
          ['Feedback', '24', '4 today'],
          ['Unread', '6', 'needs review'],
          ['Avg rating', '4.8', '18 rated'],
        ].map(([label, value, detail]) => (
          <section key={label} className="border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold leading-none tabular-nums">{value}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{detail}</p>
          </section>
        ))}
      </div>
      <section className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-primary/25 bg-card p-4 shadow-sm">
        <div data-tour="dashboard-capabilities">
          <h2 className="text-sm font-semibold">Your first complete feedback loop</h2>
          <p className="mt-1 text-xs text-muted-foreground">Customize, install, collect, triage, and close the loop.</p>
        </div>
        <Button size="sm">Continue setup</Button>
      </section>
      <SectionPanel title="Recent activity" contentClassName="p-0">
        {['Checkout button disappears on mobile', 'Keyboard shortcut for search', 'The import flow is much clearer'].map((message, index) => (
          <div key={message} className={cn('flex items-center gap-3 px-4 py-3 text-sm', index > 0 && 'border-t')}>
            <span className={cn('h-2 w-2 rounded-full', index === 0 ? 'bg-primary' : 'bg-muted-foreground/35')} />
            <span className="min-w-0 flex-1 truncate">{message}</span>
            <span className="text-xs text-muted-foreground">{index === 0 ? '2m' : index === 1 ? '18m' : '1h'}</span>
          </div>
        ))}
      </SectionPanel>
    </div>
  )
}

function SettingBlock({ target, title, children }: { target?: string; title: string; children: ReactNode }) {
  return (
    <section data-tour={target} className="border-b pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function FormDemo() {
  return (
    <div className="space-y-7">
      <PracticeHeader title="Feedback form" description="Edit the saved form without replacing the installed snippet." meta={<Badge variant="secondary">Saved</Badge>} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
          <header className="border-b bg-surface-raised/70 p-5"><h2 className="text-lg font-semibold">Widget settings</h2><p className="mt-1 text-sm text-muted-foreground">Choose where feedback appears, then tune the form details below.</p></header>
          <div className="space-y-5 p-5">
          <SettingBlock title="Placement">
            <p className="mb-3 text-sm text-muted-foreground">Choose how the feedback form appears. The shared embed applies this remotely.</p>
            <div className="grid grid-cols-3 gap-2 text-left text-xs">
              {[
                ['Floating button', 'Adds a feedback button to your site.', Send],
                ['Custom trigger', 'Connects feedback to your own button.', MousePointerClick],
                ['Inline form', 'Embeds the full form on a page.', PanelTop],
              ].map(([label, body, Icon], index) => {
                const PlacementIcon = Icon as LucideIcon
                return <span key={label as string} data-tour={index === 0 ? 'widget-placement' : undefined} className={cn('rounded-lg border p-3', index === 0 && 'border-primary bg-primary/[0.06]')}><PlacementIcon className="h-4 w-4 text-primary" /><span className="mt-2 block font-semibold text-foreground">{label as string}</span><span className="mt-1 block leading-4 text-muted-foreground">{body as string}</span></span>
              })}
            </div>
          </SettingBlock>
          <SettingBlock target="widget-appearance" title="Appearance">
            <div className="flex items-center gap-3 text-xs"><span className="h-8 w-8 rounded-md bg-primary" /><span className="flex-1 rounded-md border px-3 py-2">Send feedback</span><span className="rounded-md border px-3 py-2">Bottom right</span></div>
          </SettingBlock>
          <SettingBlock target="widget-content" title="Form content">
            <div className="space-y-2 text-xs"><div className="rounded-md border px-3 py-2">Help us improve</div><div className="rounded-md border px-3 py-2 text-muted-foreground">What happened, and what did you expect?</div></div>
          </SettingBlock>
          <SettingBlock target="widget-protection" title="Optional fields and protection">
            <div className="flex flex-wrap gap-2 text-xs">{['Type', 'Rating', 'Screenshot', 'Email', 'Human check'].map((label, index) => <span key={label} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5"><span className={cn('h-3.5 w-3.5 rounded-sm border', index < 3 && 'border-primary bg-primary text-primary-foreground')} >{index < 3 ? <Check className="h-3 w-3" /> : null}</span>{label}</span>)}</div>
          </SettingBlock>
          </div>
        </section>
        <section data-tour="widget-preview" className="h-fit overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)] xl:sticky xl:top-4">
          <header className="border-b bg-surface-raised/70 p-5"><h2 className="text-lg font-semibold">Live form preview</h2><p className="mt-1 text-sm text-muted-foreground">Previewing the current draft.</p></header>
          <div className="p-5"><div className="mx-auto max-w-xs rounded-xl border bg-surface-inset p-4">
            <div className="rounded-lg border bg-card p-4 shadow-md">
              <MessageSquareText className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">Help us improve</h3>
              <div className="mt-3 h-20 rounded-md border bg-background p-2 text-xs text-muted-foreground">What happened, and what did you expect?</div>
              <div className="mt-3 flex h-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">Send feedback</div>
            </div>
          </div></div>
        </section>
      </div>
    </div>
  )
}

function InstallDemo() {
  return (
    <div className="space-y-6">
      <PracticeHeader title="Install feedback" description="Choose your stack, copy the snippet once, then verify a real test." />
      <SectionPanel title="Choose your stack" description="Add the shared embed before the closing body tag." contentClassName="space-y-4">
        <div className="flex flex-wrap gap-1 rounded-md border bg-surface-inset p-1 text-xs">
          {['Website', 'React', 'Next.js', 'Vue', 'Other'].map((label, index) => <span key={label} data-tour={index === 0 ? 'install-platforms' : undefined} className={cn('min-h-10 rounded px-3 py-2.5', index === 0 ? 'bg-surface-soft font-semibold text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground')}>{label}{index === 0 ? <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-primary">Recommended</span> : null}</span>)}
        </div>
        <section className="overflow-hidden rounded-md border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3"><div data-tour="install-code"><h2 className="text-sm font-semibold">Website embed</h2><p className="mt-0.5 text-xs text-muted-foreground">Paste before the closing body tag.</p></div><span className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Copy className="h-3.5 w-3.5" /> Copy</span></div>
        <pre className="overflow-hidden bg-zinc-950 p-4 text-xs leading-6 text-zinc-200"><code>{'<script\n  src="https://app.feedbacks.dev/widget/latest.js"\n  data-project="pk_demo_acme"\n  defer\n></script>'}</code></pre>
        <div className="flex items-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> This practice key is an example and cannot submit data.</div>
        </section>
      </SectionPanel>
    </div>
  )
}

function InboxDemo() {
  const rows = [
    ['Checkout button disappears on mobile', 'Bug', 'High signal', '2m'],
    ['A keyboard shortcut for search would help', 'Idea', 'Onboarding', '18m'],
    ['The new import flow is much clearer', 'Praise', 'Import', '1h'],
  ]
  return (
    <div className="space-y-5">
      <PracticeHeader eyebrow="Inbox" title="Feedback" description="Review new messages and move the useful signal forward." action={<div className="text-right"><p className="text-xl font-semibold tabular-nums">24</p><p className="text-xs text-muted-foreground">messages</p></div>} />
      <section data-tour="inbox-filters" className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="flex min-w-52 flex-1 items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search feedback…</span>{['All', 'Unread', 'New', 'Reviewed', 'Planned'].map((label, index) => <span key={label} className={cn('flex items-center gap-1.5 rounded-full border px-3 py-2', index === 1 && 'border-primary bg-primary/[0.06] text-primary')}>{index === 1 ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}{label}</span>)}</div>
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
        {rows.map(([message, type, tag, time], index) => (
          <div key={message} className={cn('flex items-start gap-3 px-4 py-3', index > 0 && 'border-t')}>
            <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', index === 0 ? 'bg-primary' : 'bg-muted')} />
            <div data-tour={index === 0 ? 'inbox-list' : undefined} className="w-fit min-w-0 max-w-[75%]"><p className="truncate text-sm font-medium">{message}</p><div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span>{type}</span><span>·</span><span>{tag}</span><span>·</span><span>Chrome on Android</span></div></div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 5 · {time}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

function UpdatesDemo() {
  return (
    <div className="space-y-5">
      <PracticeHeader eyebrow="Inside your product" title="Updates for your users" description="Publish concise “What’s new” messages through the connected embed." action={<div className="flex gap-2"><Button variant="outline"><Settings2 className="mr-2 h-4 w-4" />Display settings</Button><Button><Plus className="mr-2 h-4 w-4" />New release note</Button></div>} />
      <section className="divide-y overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        {[
          ['v2.4 · Faster CSV imports', 'Published · Aug 24 · 247 views · 31 CTA clicks'],
          ['Mobile checkout fixes', 'Draft · Not published · 0 views'],
          ['Keyboard-first search', 'Published · Aug 19 · 183 views · 22 CTA clicks'],
        ].map((row) => <div key={row[0]} className="flex min-h-20 items-center gap-3 p-3"><div className="min-w-0 flex-1 rounded-md p-2"><p className="text-sm font-medium">{row[0]}</p><p className="mt-1 text-xs text-muted-foreground">{row[1]}</p></div><Badge variant="outline">Visible</Badge><Eye className="h-4 w-4 text-muted-foreground" /></div>)}
      </section>
    </div>
  )
}

function BoardDemo() {
  return (
    <div className="space-y-5">
      <PracticeHeader title="Public feedback page" description="Give users one place to share ideas, vote, and see your replies." meta={<><Badge variant="secondary">Published</Badge><Badge variant="outline">Listed</Badge></>} action={<div className="flex gap-2"><Button variant="outline"><Copy className="mr-2 h-4 w-4" />Copy link</Button><Button variant="outline"><ExternalLink className="mr-2 h-4 w-4" />Open page</Button></div>} />
      <div className="flex flex-col gap-3 rounded-lg border bg-surface-raised/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-xs text-muted-foreground">feedbacks.dev/p/acme-studio</p><div className="flex gap-5 text-xs text-muted-foreground"><span><strong className="text-foreground">128</strong> followers</span><span><strong className="text-foreground">42</strong> watched posts</span><span><strong className="text-foreground">0</strong> reports to check</span></div></div>
      <div className="flex gap-2 overflow-hidden rounded-lg border bg-surface-raised p-1.5">{['Identity', 'Content', 'Visibility', 'Advanced'].map((label, index) => <span key={label} className={cn('min-h-10 rounded-md border px-4 py-2 text-sm font-medium', index === 0 ? 'border-border bg-card shadow-sm' : 'border-transparent text-muted-foreground')}>{label}</span>)}</div>
      <SectionPanel title="Page identity" description="Set the public name, URL, and visual identity users see.">
        <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-medium text-muted-foreground">Page name</p><div className="mt-1.5 rounded-md border px-3 py-2 text-sm">Acme Studio</div></div><div><p className="text-xs font-medium text-muted-foreground">Public URL</p><div className="mt-1.5 rounded-md border px-3 py-2 font-mono text-sm">acme-studio</div></div></div>
      </SectionPanel>
    </div>
  )
}

function IntegrationsDemo() {
  return (
    <div className="space-y-4">
      <PracticeHeader title="Integrations" description="Send important feedback to Slack, Discord, GitHub, or your own webhook." />
      <div className="flex items-center justify-between border-b pb-4 text-sm"><span className="font-medium">0 of 1 active endpoints used on Free</span><Button variant="outline" size="sm">View Pro limits</Button></div>
      {[
        ['Slack', 'Send selected feedback to a Slack channel.'],
        ['Discord', 'Post important feedback to your Discord server.'],
        ['GitHub', 'Create issues from high-signal feedback.'],
        ['Webhooks', 'Send a signed payload to your own endpoint.'],
      ].map(([label, body], index) => (
        <section key={label} className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 bg-surface-raised/55 px-5 py-4"><div data-tour={index === 0 ? 'integration-endpoint' : undefined}><div className="flex items-center gap-2"><Webhook className="h-4 w-4 text-primary" /><h2 className="text-base font-semibold">{label}</h2><span className="text-xs text-muted-foreground">Not connected</span></div><p className="mt-1 text-sm text-muted-foreground">{body}</p></div><Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Add {label} endpoint</Button></div>
        </section>
      ))}
    </div>
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
