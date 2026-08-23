import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary, getHistoryCutoff } from '@/lib/billing'
import { notFound } from 'next/navigation'
import type { Feedback, FeedbackNote } from '@/lib/types'
import { getFeedbackReadAtUpdate } from '@/lib/feedback-read-state'
import { cn, formatDate, getTypeColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
  Globe,
  Monitor,
  Mail,
  Bot,
  Star,
  Tag,
  Clock,
  FolderOpen,
  ImageIcon,
  Paperclip,
  StickyNote,
  Bug,
  Lightbulb,
  Smile,
  CircleHelp,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { FeedbackActions } from './feedback-actions'
import { FeedbackScreenshot } from './feedback-screenshot'
import { PageHeader } from '@/components/ui/workspace-shell'
import {
  FeedbackActivityTimeline,
  FeedbackHeadlineState,
  FeedbackLiveProvider,
  FeedbackNotesList,
  FeedbackTagsState,
  type FeedbackActivity,
} from './feedback-live-state'
import { sanitizeRedirectPath } from '@/lib/redirects'

export const metadata = { title: 'Feedback Details' }

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

function formatFeedbackUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return value
  }
}

export default async function FeedbackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { id } = await params
  const requestedReturnTo = sanitizeRedirectPath((await searchParams).returnTo, '/feedback')
  const inboxHref = requestedReturnTo === '/feedback' || requestedReturnTo.startsWith('/feedback?')
    ? requestedReturnTo
    : '/feedback'
  const supabase = await createServerSupabase()
  const billingSummary = await getCurrentUserBillingSummary()
  const historyCutoff = billingSummary ? getHistoryCutoff(billingSummary) : null

  const { data: feedback } = await (historyCutoff
      ? supabase
        .from('feedback')
        .select('*, projects(id, name)')
        .eq('id', id)
        .gte('created_at', historyCutoff)
        .single()
      : supabase
        .from('feedback')
        .select('*, projects(id, name)')
        .eq('id', id)
        .single())

  if (!feedback) notFound()

  const fb = feedback as Feedback
  const [{ data: notes }, { data: activity }, { data: recentProjectFeedback }] = await Promise.all([
    supabase
      .from('feedback_notes')
      .select('*')
      .eq('feedback_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('feedback_activity')
      .select('id,event_type,from_value,to_value,created_at')
      .eq('feedback_id', id)
      .neq('event_type', 'created')
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('feedback')
      .select('tags')
      .eq('project_id', fb.project_id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])
  const suggestedTags = [
    ...new Set(
      (recentProjectFeedback || [])
        .flatMap((item) => item.tags || [])
        .filter((tag): tag is string => typeof tag === 'string' && Boolean(tag)),
    ),
  ].slice(0, 20)
  const readAtUpdate = getFeedbackReadAtUpdate(fb)
  if (readAtUpdate) {
    const { error } = await supabase
      .from('feedback')
      .update(readAtUpdate)
      .eq('id', fb.id)
      .is('read_at', null)

    if (!error) {
      fb.read_at = readAtUpdate.read_at
    }
  }

  const hasDetails = Boolean(
    fb.projects ||
      fb.email ||
      fb.rating ||
      fb.url ||
      fb.user_agent ||
      (fb.tags && fb.tags.length > 0),
  )

  return (
    <FeedbackLiveProvider
      key={fb.id}
      initialStatus={fb.status}
      initialPriority={fb.priority}
      initialTags={fb.tags || []}
      initialNotes={(notes as FeedbackNote[] | null) || []}
      initialActivity={(activity as FeedbackActivity[] | null) || []}
      createdAt={fb.created_at}
    >
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Review feedback"
        description={fb.projects ? `Submitted to ${fb.projects.name} on ${formatDate(fb.created_at)}` : `Submitted on ${formatDate(fb.created_at)}`}
        action={
          <Button asChild variant="secondary" size="sm" className="w-full gap-2 border shadow-sm sm:w-auto">
            <Link href={inboxHref}><ArrowLeft className="h-4 w-4" />Back to inbox</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Feedback message */}
          <Card className="overflow-hidden border-l-4 border-l-primary shadow-[var(--shadow-card)]">
            <CardHeader className="border-b bg-surface-raised/60 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">User message</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeIcon type={fb.type} className="h-5 w-5 text-muted-foreground" />
                    {fb.type && (
                      <Badge variant="secondary" className={getTypeColor(fb.type)}>
                        {fb.type}
                      </Badge>
                    )}
                    <FeedbackHeadlineState />
                  </div>
                </div>
                {fb.rating !== null && (
                  <div className="flex items-center gap-1 rounded-md border bg-background px-3 py-2" aria-label={`Rating ${fb.rating} out of 5`}>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold tabular-nums">{fb.rating}/5</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="max-w-[72ch] whitespace-pre-wrap text-lg font-medium leading-8 text-foreground">
                {fb.message}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(fb.created_at)}
              </div>
            </CardContent>
          </Card>

          {/* Mobile-only: key metadata inline */}
          <div className="flex flex-wrap gap-3 lg:hidden">
            {fb.projects && (
              <Link href={`/feedback?projectId=${fb.projects.id}`} className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium transition-colors hover:bg-accent">
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                {fb.projects.name}
              </Link>
            )}
            {fb.email && (
              <span className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {fb.email}
              </span>
            )}
            {fb.rating !== null && (
              <span className="flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-xs" aria-label={`Rating ${fb.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < fb.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                  />
                ))}
                <span className="ml-1 font-medium">{fb.rating}/5</span>
              </span>
            )}
          </div>

          {/* Screenshot */}
          {(fb.screenshot_path || fb.screenshot_url) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Screenshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FeedbackScreenshot src={`/api/feedback/${fb.id}/media/screenshot`} />
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {fb.attachments && fb.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attachments ({fb.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fb.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={`/api/feedback/${fb.id}/media/attachment?mediaId=${encodeURIComponent(att.mediaId)}`}
                      download={att.name}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium">{att.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(att.size / 1024)}KB
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Triage and notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Triage and internal notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FeedbackActions
                feedbackId={fb.id}
                projectId={fb.project_id}
                currentStatus={fb.status}
                currentPriority={fb.priority}
                currentTags={fb.tags}
                suggestedTags={suggestedTags}
                currentVersion={fb.updated_at}
                inboxHref={inboxHref}
              />
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Internal notes</h3>
                <FeedbackNotesList />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {/* Structured metadata rows */}
              {hasDetails ? (
              <div className="divide-y">
                {fb.projects && (
                  <div className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[7rem_minmax(0,1fr)]">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FolderOpen className="h-3.5 w-3.5" />
                      Project
                    </span>
                    <Link
                      href={`/feedback?projectId=${fb.projects.id}`}
                      className="min-w-0 truncate text-sm font-medium hover:underline"
                    >
                      {fb.projects.name}
                    </Link>
                  </div>
                )}
                {fb.email && (
                  <div className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[7rem_minmax(0,1fr)]">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </span>
                    <a href={`mailto:${fb.email}`} className="min-w-0 truncate text-sm font-medium hover:underline">{fb.email}</a>
                  </div>
                )}
                {fb.rating !== null && (
                  <div className="grid gap-2 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[7rem_minmax(0,1fr)]">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5" />
                      Rating
                    </span>
                    <div className="flex items-center gap-0.5" aria-label={`Rating ${fb.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < fb.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                        />
                      ))}
                      <span className="ml-1.5 text-sm font-medium">{fb.rating}/5</span>
                    </div>
                  </div>
                )}
                {fb.url && (
                  <div className="py-3">
                    <span className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Page URL
                    </span>
                    <a
                      href={fb.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <span className="truncate">{formatFeedbackUrl(fb.url)}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </div>
                )}
                {fb.user_agent && (
                  <div className="py-3">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                        <Monitor className="h-3.5 w-3.5" />
                        Technical browser details
                      </summary>
                      <p className="mt-2 break-words rounded-md bg-surface-raised p-3 text-[11px] leading-5 text-muted-foreground">
                        {fb.user_agent}
                      </p>
                    </details>
                  </div>
                )}
              </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                  No contact, page, browser, or tag context was captured for this submission.
                </div>
              )}
              <div className="mt-3 border-t py-3">
                <span className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </span>
                <FeedbackTagsState />
              </div>
            </CardContent>
          </Card>

          <StructuredDataCard feedback={fb} />

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackActivityTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </FeedbackLiveProvider>
  )
}

function StructuredDataCard({ feedback }: { feedback: Feedback }) {
  const structuredEntries = Object.entries(feedback.structured_data || {})

  if (!feedback.agent_name && !feedback.agent_session_id && structuredEntries.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Agent context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {feedback.agent_name && (
            <Badge variant="secondary">Agent: {feedback.agent_name}</Badge>
          )}
          {feedback.agent_session_id && (
            <Badge variant="outline">Session: {feedback.agent_session_id}</Badge>
          )}
        </div>

        {structuredEntries.length > 0 ? (
          <div className="space-y-3">
            {structuredEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {key.replace(/_/g, ' ')}
                </p>
                <div className="mt-2 text-sm">
                  {Array.isArray(value) || (value && typeof value === 'object') ? (
                    <pre className="overflow-x-auto rounded bg-background p-3 text-xs leading-relaxed">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-foreground">
                      {String(value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This submission has agent metadata but no structured payload.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
