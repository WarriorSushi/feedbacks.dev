import { createServerSupabase } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { getCurrentUserBillingSummary, getHistoryCutoff } from '@/lib/billing'
import { Button } from '@/components/ui/button'
import { DashboardRefresher } from '@/components/dashboard-refresher'
import { PageHeader, SectionPanel } from '@/components/ui/workspace-shell'
import { isFeedbackUnread } from '@/lib/feedback-read-state'
import { cn, formatRelativeTime, truncate, getStatusColor } from '@/lib/utils'
import type { Feedback } from '@/lib/types'
import { CURRENT_PROJECT_COOKIE, getSelectedProject } from '@/lib/project-selection'
import { loadDashboardStats } from '@/lib/dashboard-stats'
import Link from 'next/link'
import {
  Star,
  ArrowRight,
  Plus,
  Inbox,
  TrendingUp,
  Bot,
  Code2,
  BarChart3,
  Bug,
  Lightbulb,
  Smile,
  CircleHelp,
  MessageSquare,
} from 'lucide-react'

export const metadata = { title: 'Dashboard' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const typeIcons = {
  bug: Bug,
  idea: Lightbulb,
  praise: Smile,
  question: CircleHelp,
  other: MessageSquare,
}

function TypeIcon({ type, className }: { type?: string | null; className?: string }) {
  const Icon = typeIcons[(type || 'other') as keyof typeof typeIcons] || MessageSquare
  return <Icon className={cn('h-4 w-4', className)} />
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; scope?: string }>
}) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [billingSummary, cookieStore, requestedParams, { data: ownedProjects }] = await Promise.all([
    getCurrentUserBillingSummary(),
    cookies(),
    searchParams,
    supabase
      .from('projects')
      .select('id, name, settings')
      .eq('owner_user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])
  const historyCutoff = billingSummary ? getHistoryCutoff(billingSummary) : null
  const selectedProject = getSelectedProject(
    ownedProjects || [],
    requestedParams.project || cookieStore.get(CURRENT_PROJECT_COOKIE)?.value,
  )
  const showingAllProjects = requestedParams.scope === 'all'
  const scopedProjectId = showingAllProjects ? undefined : selectedProject?.id
  const feedbackHref = showingAllProjects
    ? '/feedback?projectId=all'
    : scopedProjectId
      ? `/feedback?projectId=${scopedProjectId}`
      : '/feedback'

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00'

  let totalQuery = historyCutoff
    ? supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('is_archived', false).gte('created_at', historyCutoff)
    : supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('is_archived', false)
  let unreadQuery = historyCutoff
    ? supabase.from('feedback').select('*', { count: 'exact', head: true }).is('read_at', null).eq('is_archived', false).gte('created_at', historyCutoff)
    : supabase.from('feedback').select('*', { count: 'exact', head: true }).is('read_at', null).eq('is_archived', false)
  let ratingQuery = historyCutoff
    ? supabase.from('feedback').select('rating').not('rating', 'is', null).eq('is_archived', false).gte('created_at', historyCutoff)
    : supabase.from('feedback').select('rating').not('rating', 'is', null).eq('is_archived', false)
  let recentQuery = historyCutoff
    ? supabase.from('feedback').select('*, projects(id, name)').eq('is_archived', false).gte('created_at', historyCutoff).order('created_at', { ascending: false }).limit(8)
    : supabase.from('feedback').select('*, projects(id, name)').eq('is_archived', false).order('created_at', { ascending: false }).limit(8)
  let typeQuery = historyCutoff
    ? supabase.from('feedback').select('type').eq('is_archived', false).gte('created_at', historyCutoff)
    : supabase.from('feedback').select('type').eq('is_archived', false)
  let sparkQuery = supabase
    .from('feedback')
    .select('created_at')
    .gte('created_at', historyCutoff && historyCutoff > sevenDaysAgoStr ? historyCutoff : sevenDaysAgoStr)
    .eq('is_archived', false)

  if (scopedProjectId) {
    totalQuery = totalQuery.eq('project_id', scopedProjectId)
    unreadQuery = unreadQuery.eq('project_id', scopedProjectId)
    ratingQuery = ratingQuery.eq('project_id', scopedProjectId)
    recentQuery = recentQuery.eq('project_id', scopedProjectId)
    typeQuery = typeQuery.eq('project_id', scopedProjectId)
    sparkQuery = sparkQuery.eq('project_id', scopedProjectId)
  }

  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const [aggregateStats, { data: recentFeedback }] = await Promise.all([
    loadDashboardStats({
      userId: user!.id,
      projectId: scopedProjectId,
      historyCutoff,
      trendStart: sevenDaysAgoStr,
    }),
    recentQuery,
  ])

  let total = aggregateStats?.total || 0
  let unread = aggregateStats?.unread || 0
  let avgRating = aggregateStats?.averageRating ?? null
  let ratingCount = aggregateStats?.ratingCount || 0
  const typeCounts = { bug: 0, idea: 0, praise: 0, question: 0, other: 0 }
  let sparkCounts = days7.map((day) => aggregateStats?.dailyCounts[day] || 0)

  if (aggregateStats) {
    Object.entries(aggregateStats.typeCounts).forEach(([type, count]) => {
      if (type in typeCounts) typeCounts[type as keyof typeof typeCounts] = count
      else typeCounts.other += count
    })
  } else {
    // Compatibility fallback while migration 025 is being applied to an older environment.
    const [
      { count: totalCount },
      { count: unreadCount },
      { data: ratingData },
      { data: typeDist },
      { data: sparkData },
    ] = await Promise.all([totalQuery, unreadQuery, ratingQuery, typeQuery, sparkQuery])
    total = totalCount || 0
    unread = unreadCount || 0
    ratingCount = ratingData?.length || 0
    avgRating = ratingCount
      ? ratingData!.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / ratingCount
      : null
    typeDist?.forEach((feedback) => {
      const type = feedback.type as string
      if (type in typeCounts) typeCounts[type as keyof typeof typeCounts]++
      else typeCounts.other++
    })
    sparkCounts = days7.map(
      (day) => sparkData?.filter((feedback) => feedback.created_at.startsWith(day)).length || 0,
    )
  }

  const sparkMax = Math.max(...sparkCounts, 1)
  const projects = ownedProjects?.length || 0
  const primaryProject = selectedProject
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  const feedbackLink = (params?: Record<string, string>) => {
    const query = new URLSearchParams()
    if (showingAllProjects) query.set('projectId', 'all')
    else if (scopedProjectId) query.set('projectId', scopedProjectId)
    Object.entries(params || {}).forEach(([key, value]) => query.set(key, value))
    const suffix = query.toString()
    return suffix ? `/feedback?${suffix}` : '/feedback'
  }

  const statCards = [
    {
      id: 'total',
      label: 'Feedback',
      value: total,
      urgent: false,
      sub: `${sparkCounts[sparkCounts.length - 1]} today`,
      href: feedbackHref,
    },
    {
      id: 'unread',
      label: 'Unread',
      value: unread,
      urgent: unread > 0,
      sub: unread > 0 ? 'needs review' : 'all caught up',
      href: feedbackLink({ read: 'unread' }),
    },
    {
      id: 'rating',
        label: 'Avg rating',
      value: avgRating ? avgRating.toFixed(1) : 'N/A',
      urgent: false,
      sub: ratingCount ? `${ratingCount} rated` : 'no ratings yet',
      href: feedbackHref,
    },
  ]

  const typeColorMap: Record<string, string> = {
    bug: 'bg-red-500',
    idea: 'bg-indigo-500',
    praise: 'bg-emerald-500',
    question: 'bg-sky-500',
    other: 'bg-zinc-400',
  }

  if (projects === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          eyebrow="Welcome"
          title={`Good ${getGreeting()}, ${displayName}`}
          description="Create one project, copy one snippet, and send one test. That is the whole first run."
        />
        <SectionPanel contentClassName="p-0">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-medium text-primary">Start here</p>
              <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-[-0.035em]">
                Name the product that will collect feedback.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Only the name is required. The recommended Website snippet appears on the next screen.
              </p>
              <Button asChild size="lg" className="mt-6 gap-2">
                <Link href="/projects/new">
                  Create your first project
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ol className="divide-y border-t bg-surface-raised/55 lg:border-l lg:border-t-0">
              {[
                ['1', 'Name project'],
                ['2', 'Copy snippet'],
                ['3', 'Verify test'],
              ].map(([step, label], index) => (
                <li key={step} className="flex items-center gap-3 px-5 py-4">
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold',
                    index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
                  )}>
                    {step}
                  </span>
                  <span className={cn('text-sm font-medium', index === 0 ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good ${getGreeting()}, ${displayName}`}
        description={unread > 0
          ? `${unread} unread ${unread === 1 ? 'item needs' : 'items need'} review.`
          : total > 0
            ? 'Your inbox is clear. Recent product signal is below.'
            : 'Connect the project and send one test to start the feedback loop.'}
        meta={selectedProject && (
          <div className="inline-flex items-center rounded-md border bg-surface-raised p-0.5 text-xs" aria-label="Dashboard project scope">
            <Link
              href="/dashboard"
              data-testid="dashboard-current-project-scope"
              aria-current={!showingAllProjects ? 'page' : undefined}
              className={cn(
                'rounded px-2.5 py-1.5 font-medium transition-colors',
                !showingAllProjects ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {selectedProject.name}
            </Link>
            <Link
              href="/dashboard?scope=all"
              data-testid="dashboard-all-projects-scope"
              aria-current={showingAllProjects ? 'page' : undefined}
              className={cn(
                'rounded px-2.5 py-1.5 font-medium transition-colors',
                showingAllProjects ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              All projects
            </Link>
          </div>
        )}
        action={
          <div data-tour="dashboard-actions" className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/projects/new"><Plus className="h-3.5 w-3.5" />New project</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href={feedbackHref}><Inbox className="h-3.5 w-3.5" />Inbox{unread > 0 && ` (${unread})`}</Link>
            </Button>
          </div>
        }
      />

      {billingSummary && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-muted-foreground">
          <span>{billingSummary.entitlements.label} plan</span>
          <span>
            {billingSummary.entitlements.feedbackMonthlyLimit
              ? `${billingSummary.usage.feedbackThisMonth} of ${billingSummary.entitlements.feedbackMonthlyLimit} monthly feedback used`
              : 'Unlimited feedback and full history'}
          </span>
        </div>
      )}

      {total === 0 && primaryProject ? (
        <div data-tour="dashboard-capabilities" className="flex flex-col gap-4 rounded-lg border border-primary/25 bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Send the first test for {primaryProject.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Copy the default install code, send one known test, then confirm it reaches the inbox.
              </p>
            </div>
          </div>
          <Button asChild className="min-h-11 shrink-0 sm:min-h-10">
            <Link href={`/projects/${primaryProject.id}?tab=install`}>
              Continue setup <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : <DashboardRefresher />}

      {/* ─── Stat Cards ───────────────────────────────────── */}
      <div className="grid overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)] sm:grid-cols-3">
        {statCards.map((stat) => (
          <Link key={stat.id} href={stat.href} className={cn('block border-b border-border p-4 transition-colors last:border-b-0 hover:bg-surface-raised/55 sm:border-b-0 sm:border-r sm:last:border-r-0', stat.urgent && 'bg-amber-50/55 dark:bg-amber-950/20')}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    'mt-2 text-xl font-semibold leading-none tabular-nums',
                    stat.urgent && 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* ─── Activity + Sidebar ───────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_272px]">
        {/* Recent Activity Feed */}
        <SectionPanel
          title="Recent activity"
          contentClassName="p-0"
          action={
            <Link href={feedbackHref}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        >
            {!recentFeedback || recentFeedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-sm font-medium">No feedback yet</p>
                <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                  Your first verified test will appear here.
                </p>
                {primaryProject && <Link href={`/projects/${primaryProject.id}/install`} className="mt-4">
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                    Continue setup
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>}
              </div>
            ) : (
              <div>
                {(recentFeedback as Feedback[]).map((fb) => (
                  <Link
                    key={fb.id}
                    href={`/feedback/${fb.id}`}
                    className={cn(
                      'group flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/40',
                      isFeedbackUnread(fb) &&
                        'bg-primary/[0.04] ring-1 ring-inset ring-primary/15 hover:bg-primary/[0.06] dark:bg-primary/[0.07]'
                    )}
                  >
                    <TypeIcon type={fb.type} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-[13px] leading-snug text-foreground/75 transition-colors group-hover:text-foreground',
                          isFeedbackUnread(fb) && 'font-medium text-foreground/90'
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
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Bot className="h-3 w-3" />
                              {fb.agent_name}
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
        </SectionPanel>

        {/* Hide this sidebar on mobile and show shortcuts above instead. */}
        <div className="hidden flex-col gap-4 lg:flex">
          {/* Type Breakdown */}
          <SectionPanel
            title="Feedback types"
            contentClassName="space-y-3 p-4"
          >
              {total === 0 ? (
                <div className="py-6 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/40" />
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
                            <TypeIcon type={type} className="h-3.5 w-3.5" /> {type}
                          </span>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {count}{' '}
                            <span className="text-muted-foreground">({pct}%)</span>
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
          </SectionPanel>

        </div>
      </div>

      {/* ─── 7-Day Trend Chart ────────────────────────────── */}
      {total > 0 && <section className="border-t border-foreground/10 pt-4">
        <header className="flex flex-row items-center justify-between pb-3">
          <div>
            <h2 className="text-sm font-semibold">Feedback volume</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Last 7 days</p>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </header>
        <div>
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
                        isToday ? 'text-primary' : 'text-muted-foreground'
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
        </div>
      </section>}
    </div>
  )
}
