import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Feedback, FeedbackNote } from '@/lib/types'
import { formatDate, getTypeIcon, getStatusColor, getTypeColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Globe, Monitor, Mail, Star, Tag } from 'lucide-react'
import { FeedbackActions } from './feedback-actions'

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: feedback } = await supabase
    .from('feedbacks')
    .select('*, projects(id, name)')
    .eq('id', id)
    .single()

  if (!feedback) notFound()

  const fb = feedback as Feedback

  const { data: notes } = await supabase
    .from('feedback_notes')
    .select('*')
    .eq('feedback_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <Link
        href="/feedback"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to inbox
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">{getTypeIcon(fb.type)}</span>
                {fb.type && (
                  <Badge variant="secondary" className={getTypeColor(fb.type)}>
                    {fb.type}
                  </Badge>
                )}
                <Badge variant="secondary" className={getStatusColor(fb.status)}>
                  {fb.status.replace('_', ' ')}
                </Badge>
                {fb.priority && (
                  <Badge variant={fb.priority === 'critical' ? 'destructive' : 'outline'}>
                    {fb.priority}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {fb.message}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {formatDate(fb.created_at)}
              </p>
            </CardContent>
          </Card>

          {/* Screenshot */}
          {fb.screenshot_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fb.screenshot_url}
                  alt="Feedback screenshot"
                  className="max-w-full rounded-md border"
                />
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {fb.attachments && fb.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fb.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                    >
                      📎 {att.name}
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(att.size / 1024)}KB)
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {(notes as FeedbackNote[]).map((note) => (
                    <div key={note.id} className="rounded-md border p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
              <Separator className="my-4" />
              <FeedbackActions feedbackId={fb.id} currentStatus={fb.status} />
            </CardContent>
          </Card>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {fb.projects && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Project:</span>
                  <Link
                    href={`/projects/${fb.projects.id}`}
                    className="font-medium hover:underline"
                  >
                    {fb.projects.name}
                  </Link>
                </div>
              )}
              {fb.email && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span>{fb.email}</span>
                </div>
              )}
              {fb.url && (
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{fb.url}</span>
                </div>
              )}
              {fb.user_agent && (
                <div className="flex items-start gap-2">
                  <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="break-all text-xs">{fb.user_agent}</span>
                </div>
              )}
              {fb.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < fb.rating! ? 'fill-current' : 'opacity-30'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {fb.tags && fb.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {fb.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
