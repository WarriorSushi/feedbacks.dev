import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Loader2 } from 'lucide-react'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { CURRENT_PROJECT_COOKIE } from '@/lib/project-selection'
import { createServerSupabase } from '@/lib/supabase-server'
import { PageHeader } from '@/components/ui/workspace-shell'
import { FeedbackInboxClient } from './feedback-inbox-client'
import {
  getEarlyFeedbackProjectCandidate,
  getFeedbackHistoryCutoff,
  getFeedbackInboxQueryKey,
  parseFeedbackInboxFilters,
  queryFeedbackInbox,
  resolveFeedbackInboxProject,
  type FeedbackInboxProject,
} from './feedback-inbox-query'

type FeedbackInboxPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toURLSearchParams(values: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => searchParams.append(key, item))
    else if (value !== undefined) searchParams.set(key, value)
  }
  return searchParams
}

function decodeProjectCookie(value?: string) {
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

export default async function FeedbackInboxPage({ searchParams }: FeedbackInboxPageProps) {
  const resolvedSearchParams = await searchParams

  return (
    <Suspense fallback={<FeedbackInboxLoading />}>
      <FeedbackInboxData searchParams={resolvedSearchParams} />
    </Suspense>
  )
}

async function FeedbackInboxData({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = parseFeedbackInboxFilters(toURLSearchParams(searchParams))
  const [cookieStore, supabase] = await Promise.all([cookies(), createServerSupabase()])
  const storedProjectId = decodeProjectCookie(cookieStore.get(CURRENT_PROJECT_COOKIE)?.value)
  const earlyCandidate = getEarlyFeedbackProjectCandidate(filters, storedProjectId)

  const projectsPromise = supabase
    .from('projects')
    .select('id, name, settings')
    .order('name', { ascending: true })
  const billingPromise = getCurrentUserBillingSummary()
  const earlyFeedbackPromise = earlyCandidate.canLoadEarly
    ? billingPromise.then((billingSummary) => queryFeedbackInbox(
        supabase,
        filters,
        earlyCandidate.projectId,
        getFeedbackHistoryCutoff(billingSummary),
      ))
    : null

  const [projectsResult, billingSummary, earlyFeedback] = await Promise.all([
    projectsPromise,
    billingPromise,
    earlyFeedbackPromise,
  ])
  const projects = (projectsResult.data as FeedbackInboxProject[] | null) || []
  const { defaultProjectId, projectId } = resolveFeedbackInboxProject(
    filters,
    projects,
    storedProjectId,
  )
  const historyCutoff = getFeedbackHistoryCutoff(billingSummary)
  const initialFeedback = earlyFeedback && earlyCandidate.projectId === projectId
    ? earlyFeedback
    : await queryFeedbackInbox(supabase, filters, projectId, historyCutoff)

  return (
    <FeedbackInboxClient
      initialFeedbacks={initialFeedback.feedbacks}
      initialTotal={initialFeedback.total}
      initialProjects={projects}
      initialDefaultProjectId={defaultProjectId}
      initialHistoryDays={billingSummary?.entitlements.historyDays ?? null}
      initialHistoryCutoff={historyCutoff}
      initialQueryKey={getFeedbackInboxQueryKey(filters, projectId, historyCutoff)}
      initialLoadFailed={Boolean(projectsResult.error || initialFeedback.error)}
    />
  )
}

function FeedbackInboxLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inbox"
        title="Feedback"
        description="Review new messages and move the useful signal forward."
      />
      <section
        aria-busy="true"
        aria-label="Loading feedback"
        className="flex items-center justify-center rounded-lg border bg-card py-20 shadow-[var(--shadow-card)]"
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </section>
    </div>
  )
}
