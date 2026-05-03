import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary, getHistoryCutoff } from '@/lib/billing'
import { notFound } from 'next/navigation'
import type { Feedback, FeedbackNote } from '@/lib/types'
import { formatDate, getTypeIcon, getTypeColor, statusConfig } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'
import { FeedbackActions } from './feedback-actions'

const statusDotColor = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, v.dot])
)

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const billingSummary = await getCurrentUserBillingSummary()
  const historyCutoff = billingSummary ? getHistoryCutoff(billingSummary) : null

  const [{ data: feedback }, { data: notes }] = await Promise.all([
    (historyCutoff
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
        .single()),
    supabase
      .from('feedback_notes')
      .select('*')
      .eq('feedback_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!feedback) notFound()

  const fb = feedback as Feedback

  return (
    <div className="animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/feedback" className="transition-colors hover:text-foreground">
          Inbox
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {fb.type ? `${getTypeIcon(fb.type)} ${fb.type}` : 'Detail'}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Feedback message */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">{getTypeIcon(fb.type)}</span>
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
              <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed">
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
          {fb.screenshot_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Screenshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={fb.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-lg border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fb.screenshot_url}
                    alt="Feedback screenshot"
                    className="max-w-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  Click to open full size
                </p>
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
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      className="rounded-lg border-l-2 border-primary/30 bg-muted/50 p-3"
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
                currentStatus={fb.status}
                currentTags={fb.tags}
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
                {fb.updated_at !== fb.created_at && (
                  <div className="relative">
                    <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <p className="text-xs font-medium">Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(fb.updated_at)}
                    </p>
                  </div>
                )}
                {fb.resolved_at && (
                  <div className="relative">
                    <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                    <p className="text-xs font-medium">Resolved</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(fb.resolved_at)}
                    </p>
                  </div>
                )}
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
