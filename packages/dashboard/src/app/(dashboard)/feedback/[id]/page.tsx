import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary, getHistoryCutoff } from '@/lib/billing'
import { notFound } from 'next/navigation'
import type { Feedback, FeedbackNote } from '@/lib/types'
import { getFeedbackReadAtUpdate } from '@/lib/feedback-read-state'
import { cn, formatDate, getTypeColor, statusConfig } from '@/lib/utils'
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
  Circle,
  Bug,
  Lightbulb,
  Smile,
  CircleHelp,
  MessageSquare,
} from 'lucide-react'
import { FeedbackActions } from './feedback-actions'
import { FeedbackScreenshot } from './feedback-screenshot'
import { PageHeader } from '@/components/ui/workspace-shell'

export const metadata = { title: 'Feedback Details' }

const statusDotColor = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, v.dot])
)

const typeIcons = {
  bug: Bug,
  idea: Lightbulb,
  praise: Smile,
  question: CircleHelp,
  other: MessageSquare,
}

type FeedbackActivity = {
  id: string
  event_type: string
  from_value: unknown
  to_value: unknown
  created_at: string
}

function TypeIcon({ type, className }: { type?: string | null; className?: string }) {
  const Icon = typeIcons[(type || 'other') as keyof typeof typeIcons] || MessageSquare
  return <Icon className={cn('h-4 w-4', className)} />
}

function activityValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'none'
  if (typeof value === 'string') return value.replaceAll('_', ' ')
  if (typeof value === 'boolean') return value ? 'public' : 'private'
  if (value === null || value === undefined) return 'none'
  return String(value)
}

function activityLabel(event: FeedbackActivity): string {
  const from = activityValue(event.from_value)
  const to = activityValue(event.to_value)
  switch (event.event_type) {
    case 'status_changed': return `Status changed from ${from} to ${to}`
    case 'priority_changed': return `Priority changed from ${from} to ${to}`
    case 'tags_changed': return `Tags changed from ${from} to ${to}`
    case 'archived': return 'Archived'
    case 'restored': return 'Restored'
    case 'visibility_changed': return `Visibility changed from ${from} to ${to}`
    case 'note_added': return 'Internal note added'
    case 'public_reply_added': return 'Public reply added'
    default: return 'Feedback updated'
  }
}

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Feedback detail"
        description={fb.projects ? `From ${fb.projects.name} · ${formatDate(fb.created_at)}` : formatDate(fb.created_at)}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/feedback">Back to inbox</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Feedback message */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <TypeIcon type={fb.type} className="h-5 w-5 text-muted-foreground" />
                {fb.type && (
                  <Badge variant="secondary" className={getTypeColor(fb.type)}>
                    {fb.type}
                  </Badge>
                )}
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusDotColor[fb.status]}`} />
                  <span className="text-sm capitalize text-muted-foreground">
                    {fb.status.replace('_', ' ')}
                  </span>
                </span>
                {fb.priority && (
                  <Badge variant={fb.priority === 'critical' ? 'destructive' : 'outline'}>
                    {fb.priority}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-[72ch] whitespace-pre-wrap text-base leading-7 text-foreground">
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
            {fb.rating && (
              <span className="flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-xs">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < fb.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                  />
                ))}
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

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {(notes as FeedbackNote[]).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3"
                    >
                      <p className="text-sm leading-relaxed">{note.content}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(note.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
              <Separator className="my-4" />
              <FeedbackActions
                feedbackId={fb.id}
                projectId={fb.project_id}
                currentStatus={fb.status}
                currentPriority={fb.priority}
                currentTags={fb.tags}
                suggestedTags={suggestedTags}
                currentVersion={fb.updated_at}
              />
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
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FolderOpen className="h-3.5 w-3.5" />
                      Project
                    </span>
                    <Link
                      href={`/feedback?projectId=${fb.projects.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {fb.projects.name} inbox
                    </Link>
                  </div>
                )}
                {fb.email && (
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </span>
                    <span className="text-sm">{fb.email}</span>
                  </div>
                )}
                {fb.rating && (
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5" />
                      Rating
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < fb.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {fb.url && (
                  <div className="py-3">
                    <span className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Page URL
                    </span>
                    <span className="block break-all text-xs">{fb.url}</span>
                  </div>
                )}
                {fb.user_agent && (
                  <div className="py-3">
                    <span className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Monitor className="h-3.5 w-3.5" />
                      Browser
                    </span>
                    <span className="block break-all text-[11px] text-muted-foreground">
                      {fb.user_agent}
                    </span>
                  </div>
                )}
                {fb.tags && fb.tags.length > 0 && (
                  <div className="py-3">
                    <span className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3.5 w-3.5" />
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {fb.tags.map((tag) => (
                        <Link key={tag} href={`/feedback?tag=${encodeURIComponent(tag)}`}>
                          <Badge variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                  No contact, page, browser, or tag context was captured for this submission.
                </div>
              )}
            </CardContent>
          </Card>

          <StructuredDataCard feedback={fb} />

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 pl-4 before:absolute before:bottom-0 before:left-[7px] before:top-0 before:w-px before:bg-border">
                <div className="relative">
                  <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                  <p className="text-xs font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(fb.created_at)}
                  </p>
                </div>
                {(activity as FeedbackActivity[] | null)?.map((event) => (
                  <div key={event.id} className="relative">
                    <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-primary text-primary" />
                    <p className="text-xs font-medium">{activityLabel(event)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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
