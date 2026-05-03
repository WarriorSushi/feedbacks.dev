import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary, getHistoryCutoff } from '@/lib/billing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, truncate, getTypeIcon, getStatusColor } from '@/lib/utils'
import type { Feedback } from '@/lib/types'
import Link from 'next/link'
import {
  Star,
  Bell,
  ArrowRight,
  Plus,
  Inbox,
  TrendingUp,
  Bot,
} from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const billingSummary = await getCurrentUserBillingSummary()
  const historyCutoff = billingSummary ? getHistoryCutoff(billingSummary) : null

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00'

  const [
    { count: totalCount },
    { count: newCount },
    { data: ratingData },
    { count: projectCount },
    { count: agentCount },
    { data: recentFeedback },
    { data: typeDist },
    { data: sparkData },
  ] = await Promise.all([
    (historyCutoff
      ? supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('is_archived', false).gte('created_at', historyCutoff)
      : supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('is_archived', false)),
    (historyCutoff
      ? supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new').eq('is_archived', false).gte('created_at', historyCutoff)
      : supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new').eq('is_archived', false)),
    (historyCutoff
      ? supabase.from('feedback').select('rating').not('rating', 'is', null).eq('is_archived', false).gte('created_at', historyCutoff)
      : supabase.from('feedback').select('rating').not('rating', 'is', null).eq('is_archived', false)),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', user!.id),
    (historyCutoff
      ? supabase.from('feedback').select('*', { count: 'exact', head: true }).not('agent_name', 'is', null).eq('is_archived', false).gte('created_at', historyCutoff)
      : supabase.from('feedback').select('*', { count: 'exact', head: true }).not('agent_name', 'is', null).eq('is_archived', false)),
    (historyCutoff
      ? supabase.from('feedback').select('*, projects(id, name)').eq('is_archived', false).gte('created_at', historyCutoff).order('created_at', { ascending: false }).limit(8)
      : supabase.from('feedback').select('*, projects(id, name)').eq('is_archived', false).order('created_at', { ascending: false }).limit(8)),
    (historyCutoff
      ? supabase.from('feedback').select('type').eq('is_archived', false).gte('created_at', historyCutoff)
      : supabase.from('feedback').select('type').eq('is_archived', false)),
    supabase
      .from('feedback')
      .select('created_at')
      .gte('created_at', historyCutoff && historyCutoff > sevenDaysAgoStr ? historyCutoff : sevenDaysAgoStr)
      .eq('is_archived', false),
  ])

  const avgRating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingData.length
      : null

  // Build 7-day sparkline counts
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const sparkCounts = days7.map(
    (day) => sparkData?.filter((f) => f.created_at.startsWith(day)).length || 0
  )
  const sparkMax = Math.max(...sparkCounts, 1)

  // Type distribution
  const typeCounts = { bug: 0, idea: 0, praise: 0, question: 0, other: 0 }
  typeDist?.forEach((f) => {
    const t = f.type as string
    if (t in typeCounts) typeCounts[t as keyof typeof typeCounts]++
    else typeCounts.other++
  })

  const total = totalCount || 0
  const unread = newCount || 0
  const agents = agentCount || 0
  const projects = projectCount || 0
  const displayName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  const statCards = [
    {
      id: 'total',
      label: 'Feedback',
      value: total,
      urgent: false,
      sub: `${sparkCounts[sparkCounts.length - 1]} today`,
      href: '/feedback',
    },
    {
      id: 'unread',
      label: 'Unread',
      value: unread,
      urgent: unread > 0,
      sub: unread > 0 ? 'needs review' : 'all caught up',
      href: '/feedback?status=new',
    },
    {
      id: 'rating',
      label: 'Avg Rating',
      value: avgRating ? avgRating.toFixed(1) : '—',
      urgent: false,
      sub: ratingData?.length ? `${ratingData.length} rated` : 'no ratings yet',
      href: '/feedback',
    },
    {
      id: 'projects',
      label: 'Projects',
      value: projects,
      urgent: false,
      sub: 'active',
      href: '/projects',
    },
    {
      id: 'agents',
      label: 'Via Agent',
      value: agents,
      urgent: false,
      sub: agents > 0 ? 'AI submitted' : 'none yet',
      href: '/feedback?agent=1',
    },
  ]

  const typeColorMap: Record<string, string> = {
    bug: 'bg-red-500',
    idea: 'bg-indigo-500',
    praise: 'bg-emerald-500',
    question: 'bg-sky-500',
    other: 'bg-zinc-400',
  }

  return (
    <div className="animate-fade-in space-y-7">
      {/* ─── Header ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Good {getGreeting()},{' '}
          <span className="font-normal text-muted-foreground">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? (
            <>
              <span className="font-semibold text-foreground">{unread}</span> unread{' '}
              {unread === 1 ? 'item' : 'items'} waiting in your inbox.
            </>
          ) : total > 0 ? (
            'All caught up — here\'s your overview.'
          ) : (
            'Install the widget to start collecting feedback.'
          )}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Link href="/projects/new">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </Link>
          <Link href="/feedback">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
              <Inbox className="h-3.5 w-3.5" />
              Inbox
              {unread > 0 && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[11px] font-bold">
                  {unread}
                </span>
              )}
            </Button>
          </Link>
        </div>
        {billingSummary && (
          <p className="text-xs text-muted-foreground">
            Plan: {billingSummary.entitlements.label} · {billingSummary.entitlements.feedbackMonthlyLimit
              ? `${billingSummary.usage.feedbackThisMonth}/${billingSummary.entitlements.feedbackMonthlyLimit} feedback this month`
              : 'unlimited feedback'}{billingSummary.entitlements.historyDays
              ? ` · last ${billingSummary.entitlements.historyDays} days visible`
              : ' · full history visible'}
          </p>
        )}
      </div>

      {/* ─── Onboarding (shown when no projects) ──────────── */}
      {projects === 0 && (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-background">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">Get started in 2 minutes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up your first project and start collecting feedback from your users.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: 'Create your first project',
                  description: 'Give it a name and optional domain',
                  href: '/projects/new',
                  done: false,
                  cta: 'Create project',
                },
                {
                  step: 2,
                  title: 'Copy the install snippet',
                  description: 'Paste the Website snippet, then verify the widget renders',
                  href: null,
                  done: false,
                  cta: null,
                },
                {
                  step: 3,
                  title: 'Send a test feedback item',
                  description: 'Use the hosted verify page, then confirm it in the inbox',
                  href: null,
                  done: false,
                  cta: null,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border p-4 transition-all',
                    item.step === 1
                      ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
                      : 'border-border/60 opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      item.step === 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {item.href && item.cta && (
                    <Link href={item.href}>
                      <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
                        {item.cta}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Stat Cards ───────────────────────────────────── */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin md:grid md:grid-cols-5 md:overflow-visible">
          {statCards.map((stat) => (
            <Link key={stat.id} href={stat.href} className="block">
              <Card
                className={cn(
                  'min-w-[140px] flex-shrink-0 overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer md:min-w-0',
                  stat.urgent && 'border-l-[3px] border-l-amber-400 dark:border-l-amber-500'
                )}
              >
            <CardContent className="p-4 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={cn(
                  'mt-1.5 text-[1.625rem] font-bold leading-none tabular-nums',
                  stat.urgent && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">{stat.sub}</p>
              {/* CSS-only 7-bar sparkline */}
              <div className="mt-3 flex items-end gap-[2px]" style={{ height: 18 }}>
                {sparkCounts.map((count, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-[1px] transition-all duration-500',
                      stat.urgent
                        ? 'bg-amber-400/50 dark:bg-amber-500/40'
                        : i === sparkCounts.length - 1
                          ? 'bg-primary/65'
                          : 'bg-primary/22 dark:bg-primary/18'
                    )}
                    style={{ height: `${Math.max((count / sparkMax) * 100, 10)}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
            </Link>
        ))}
        </div>
      </div>

      {/* ─── Activity + Sidebar ───────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_272px]">
        {/* On mobile, show quick actions first as a horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin lg:hidden">
          <Link
            href="/feedback?status=new"
            className="flex min-w-[120px] flex-shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            Unread
            {unread > 0 && (
              <Badge variant="secondary" className="ml-auto h-5 text-[10px]">{unread}</Badge>
            )}
          </Link>
          <Link
            href="/feedback?type=bug"
            className="flex min-w-[100px] flex-shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <span className="text-sm leading-none">🐛</span>
            Bugs
            {typeCounts.bug > 0 && (
              <Badge variant="secondary" className="ml-auto h-5 text-[10px]">{typeCounts.bug}</Badge>
            )}
          </Link>
          <Link
            href="/feedback?type=idea"
            className="flex min-w-[100px] flex-shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <span className="text-sm leading-none">💡</span>
            Ideas
            {typeCounts.idea > 0 && (
              <Badge variant="secondary" className="ml-auto h-5 text-[10px]">{typeCounts.idea}</Badge>
            )}
          </Link>
          <Link
            href="/projects/new"
            className="flex min-w-[100px] flex-shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </Link>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <Link href="/feedback">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!recentFeedback || recentFeedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl leading-none" role="img" aria-label="Empty inbox">
                  📭
                </span>
                <p className="mt-4 text-sm font-medium">No feedback yet</p>
                <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                  Install the widget on a project and feedback will appear here as it arrives.
                </p>
                <Link href="/projects/new" className="mt-4">
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                    <Plus className="h-3 w-3" />
                    Create a project
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {(recentFeedback as Feedback[]).map((fb) => (
                  <Link
                    key={fb.id}
                    href={`/feedback/${fb.id}`}
                    className={cn(
                      'group flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/40',
                      fb.status === 'new' &&
                        'border-l-2 border-l-primary bg-primary/[0.025] hover:bg-primary/[0.05] dark:bg-primary/[0.04]'
                    )}
                  >
                    <span className="mt-0.5 shrink-0 text-base leading-none">
                      {getTypeIcon(fb.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-[13px] leading-snug text-foreground/75 transition-colors group-hover:text-foreground',
                          fb.status === 'new' && 'font-medium text-foreground/90'
                        )}
                      >
                        {truncate(fb.message, 110)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          className={cn(
                            'text-[11px] capitalize',
                            getStatusColor(fb.status)
                          )}
                        >
                          {fb.status.replace('_', ' ')}
                        </span>
                        {fb.projects && (
                          <>
                            <span className="text-[11px] text-muted-foreground/35">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {fb.projects.name}
                            </span>
                          </>
                        )}
                        {fb.agent_name && (
                          <>
                            <span className="text-[11px] text-muted-foreground/35">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              🤖 {fb.agent_name}
                            </span>
                          </>
                        )}
                        <span className="text-[11px] text-muted-foreground/35">·</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(fb.created_at)}
                        </span>
                      </div>
                    </div>
                    {fb.rating && (
                      <div className="flex shrink-0 items-center gap-0.5 self-start pt-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-2.5 w-2.5',
                              i < fb.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/15'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar — hidden on mobile, quick actions shown above instead */}
        <div className="hidden flex-col gap-4 lg:flex">
          {/* Type Breakdown */}
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold">By Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4 pt-0">
              {total === 0 ? (
                <div className="py-6 text-center">
                  <span className="text-3xl leading-none" role="img" aria-label="Chart">
                    📊
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">No data yet</p>
                </div>
              ) : (
                Object.entries(typeCounts)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const pct = Math.round((count / (total || 1)) * 100)
                    return (
                      <div key={type}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12px] capitalize">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                typeColorMap[type] || 'bg-zinc-400'
                              )}
                            />
                            {getTypeIcon(type as Parameters<typeof getTypeIcon>[0])} {type}
                          </span>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {count}{' '}
                            <span className="text-muted-foreground/50">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              typeColorMap[type] || 'bg-zinc-400'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 pb-3 pt-0">
              <Link
                href="/feedback?status=new"
                className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-[12px]">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                  Review unread
                </span>
                {unread > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {unread}
                  </Badge>
                )}
              </Link>
              <Link
                href="/feedback?type=bug"
                className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-[12px]">
                  <span className="text-sm leading-none">🐛</span>
                  Bug reports
                </span>
                {typeCounts.bug > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {typeCounts.bug}
                  </Badge>
                )}
              </Link>
              <Link
                href="/feedback?type=idea"
                className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-[12px]">
                  <span className="text-sm leading-none">💡</span>
                  Feature requests
                </span>
                {typeCounts.idea > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {typeCounts.idea}
                  </Badge>
                )}
              </Link>
              {agents > 0 && (
                <Link
                  href="/feedback?agent=1"
                  className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-2 text-[12px]">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    Agent submissions
                  </span>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {agents}
                  </Badge>
                </Link>
              )}
              <Link
                href="/projects/new"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                New project
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── 7-Day Trend Chart ────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
          <div>
            <CardTitle className="text-sm font-semibold">Feedback Volume</CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Last 7 days</p>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl leading-none" role="img" aria-label="Seedling">
                🌱
              </span>
              <p className="mt-3 text-sm font-medium">No data yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trend will appear once you receive your first feedback.
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: 96 }}>
              {days7.map((day, i) => {
                const count = sparkCounts[i] || 0
                const heightPct = Math.max((count / sparkMax) * 100, 4)
                const isToday = i === days7.length - 1
                return (
                  <div key={day} className="group flex flex-1 flex-col items-center gap-1">
                    <span
                      className={cn(
                        'text-[11px] tabular-nums',
                        count > 0 ? 'text-muted-foreground' : 'text-transparent select-none'
                      )}
                    >
                      {count || '0'}
                    </span>
                    <div
                      className={cn(
                        'w-full rounded-[3px] transition-all duration-300',
                        isToday
                          ? 'bg-primary/70'
                          : 'bg-primary/28 group-hover:bg-primary/50'
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span
                      className={cn(
                        'text-[11px] font-medium uppercase',
                        isToday ? 'text-primary' : 'text-muted-foreground/55'
                      )}
                    >
                      {new Date(day + 'T12:00:00').toLocaleDateString('en', {
                        weekday: 'short',
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
