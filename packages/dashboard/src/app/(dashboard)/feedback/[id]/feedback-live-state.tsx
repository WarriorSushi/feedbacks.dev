'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Clock, Circle } from 'lucide-react'
import { cn, formatDate, statusConfig } from '@/lib/utils'
import type { FeedbackNote, FeedbackPriority, FeedbackStatus } from '@/lib/types'

export type FeedbackActivity = {
  id: string
  event_type: string
  from_value: unknown
  to_value: unknown
  created_at: string
}

type FeedbackLiveUpdate = {
  status?: FeedbackStatus
  priority?: FeedbackPriority | null
  tags?: string[]
  note?: FeedbackNote
  activity?: FeedbackActivity
}

type FeedbackLiveContextValue = {
  status: FeedbackStatus
  priority: FeedbackPriority | null
  tags: string[]
  notes: FeedbackNote[]
  activity: FeedbackActivity[]
  createdAt: string
  announce: (update: FeedbackLiveUpdate) => void
}

const FeedbackLiveContext = React.createContext<FeedbackLiveContextValue | null>(null)

export function FeedbackLiveProvider({
  initialStatus,
  initialPriority,
  initialTags,
  initialNotes,
  initialActivity,
  createdAt,
  children,
}: {
  initialStatus: FeedbackStatus
  initialPriority: FeedbackPriority | null
  initialTags: string[]
  initialNotes: FeedbackNote[]
  initialActivity: FeedbackActivity[]
  createdAt: string
  children: React.ReactNode
}) {
  const [status, setStatus] = React.useState(initialStatus)
  const [priority, setPriority] = React.useState(initialPriority)
  const [tags, setTags] = React.useState(initialTags)
  const [notes, setNotes] = React.useState(initialNotes)
  const [activity, setActivity] = React.useState(initialActivity)

  const announce = React.useCallback((update: FeedbackLiveUpdate) => {
    if (update.status) setStatus(update.status)
    if (update.priority !== undefined) setPriority(update.priority)
    if (update.tags) setTags(update.tags)
    if (update.note) {
      setNotes((current) => current.some((note) => note.id === update.note!.id)
        ? current
        : [...current, update.note!])
    }
    if (update.activity) {
      setActivity((current) => current.some((event) => event.id === update.activity!.id)
        ? current
        : [...current, update.activity!])
    }
  }, [])

  const value = React.useMemo(() => ({
    status,
    priority,
    tags,
    notes,
    activity,
    createdAt,
    announce,
  }), [activity, announce, createdAt, notes, priority, status, tags])

  return <FeedbackLiveContext.Provider value={value}>{children}</FeedbackLiveContext.Provider>
}

function useFeedbackLiveState() {
  const context = React.useContext(FeedbackLiveContext)
  if (!context) throw new Error('Feedback live state must be used inside its provider.')
  return context
}

export function useFeedbackLiveActions() {
  return useFeedbackLiveState().announce
}

export function FeedbackHeadlineState() {
  const { status, priority } = useFeedbackLiveState()
  return (
    <>
      <span className="flex items-center gap-1.5" aria-live="polite">
        <span className={cn('inline-block h-2 w-2 rounded-full', statusConfig[status].dot)} />
        <span className="text-sm capitalize text-muted-foreground">{status.replace('_', ' ')}</span>
      </span>
      {priority ? (
        <Badge variant={priority === 'critical' ? 'destructive' : 'outline'}>{priority}</Badge>
      ) : null}
    </>
  )
}

export function FeedbackTagsState() {
  const { tags } = useFeedbackLiveState()
  if (!tags.length) return <p className="text-xs text-muted-foreground">No tags</p>
  return (
    <div className="flex flex-wrap gap-1.5" aria-live="polite">
      {tags.map((tag) => (
        <Link key={tag} href={`/feedback?tag=${encodeURIComponent(tag)}`}>
          <Badge variant="outline" className="text-xs">{tag}</Badge>
        </Link>
      ))}
    </div>
  )
}

export function FeedbackNotesList() {
  const { notes } = useFeedbackLiveState()
  if (!notes.length) return <p className="text-sm text-muted-foreground">No notes yet.</p>
  return (
    <div className="space-y-3" aria-live="polite">
      {notes.map((note) => (
        <div key={note.id} className="animate-route-enter rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
          <p className="text-sm leading-relaxed">{note.content}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(note.created_at)}
          </p>
        </div>
      ))}
    </div>
  )
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
    case 'note_added': return 'Internal note added'
    case 'visibility_changed': return `Visibility changed from ${from} to ${to}`
    case 'public_reply_added': return 'Public reply added'
    default: return 'Feedback updated'
  }
}

export function FeedbackActivityTimeline() {
  const { activity, createdAt } = useFeedbackLiveState()
  return (
    <div className="relative space-y-4 pl-4 before:absolute before:bottom-0 before:left-[7px] before:top-0 before:w-px before:bg-border" aria-live="polite">
      <div className="relative">
        <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-blue-500 text-blue-500" />
        <p className="text-xs font-medium">Created</p>
        <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
      </div>
      {activity.map((event) => (
        <div key={event.id} className="relative animate-route-enter">
          <Circle className="absolute -left-4 top-0.5 h-3.5 w-3.5 fill-primary text-primary" />
          <p className="text-xs font-medium">{activityLabel(event)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
