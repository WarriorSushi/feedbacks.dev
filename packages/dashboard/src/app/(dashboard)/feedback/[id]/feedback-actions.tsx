'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FeedbackPriority, FeedbackStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { AlertCircle, Archive, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { mutationVersionHeaders } from '@/lib/optimistic-concurrency'
import { useFeedbackLiveActions, type FeedbackActivity } from './feedback-live-state'

const statuses: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']

interface FeedbackActionsProps {
  feedbackId: string
  projectId: string
  currentStatus: FeedbackStatus
  currentPriority: FeedbackPriority | null
  currentTags: string[] | null
  suggestedTags: string[]
  currentVersion: string
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function liveActivity(eventType: string, fromValue: unknown, toValue: unknown): FeedbackActivity {
  return {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${eventType}`,
    event_type: eventType,
    from_value: fromValue,
    to_value: toValue,
    created_at: new Date().toISOString(),
  }
}

export function FeedbackActions({
  feedbackId,
  projectId,
  currentStatus,
  currentPriority,
  currentTags,
  suggestedTags,
  currentVersion,
}: FeedbackActionsProps) {
  const [status, setStatus] = React.useState(currentStatus)
  const [priority, setPriority] = React.useState<FeedbackPriority>(currentPriority || 'low')
  const [note, setNote] = React.useState('')
  const [tags, setTags] = React.useState<string[]>(currentTags || [])
  const [tagInput, setTagInput] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [tagSaving, setTagSaving] = React.useState(false)
  const [archiving, setArchiving] = React.useState(false)
  const [archived, setArchived] = React.useState(false)
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = React.useState('')
  const [lastRetry, setLastRetry] = React.useState<null | (() => Promise<void>)>(null)
  const feedbackVersionRef = React.useRef(currentVersion)
  const mutationInFlightRef = React.useRef(false)
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const announceFeedbackUpdate = useFeedbackLiveActions()

  React.useEffect(() => {
    setTags(currentTags || [])
  }, [currentTags])

  React.useEffect(() => {
    feedbackVersionRef.current = currentVersion
  }, [currentVersion])

  const patchFeedback = React.useCallback(async (changes: {
    status?: FeedbackStatus
    priority?: FeedbackPriority
    tags?: string[]
    isArchived?: boolean
  }) => {
    const response = await fetch(`/api/feedback/${feedbackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...mutationVersionHeaders(feedbackVersionRef.current),
      },
      body: JSON.stringify(changes),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(payload?.error || 'The feedback change was not saved.')
      ;(error as Error & { code?: string; currentVersion?: string }).code = payload?.code
      ;(error as Error & { code?: string; currentVersion?: string }).currentVersion = payload?.currentVersion
      throw error
    }
    feedbackVersionRef.current = payload.updated_at
    return payload
  }, [feedbackId])

  const markSaving = () => {
    setSaveState('saving')
    setSaveError('')
  }

  const markSaved = () => {
    setSaveState('saved')
    setLastRetry(null)
  }

  const markError = (message: string, retry: () => Promise<void>) => {
    setSaveState('error')
    setSaveError(message)
    setLastRetry(() => retry)
  }

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (mutationInFlightRef.current) return
    mutationInFlightRef.current = true
    const previousStatus = status
    setStatus(newStatus)
    markSaving()
    try {
      await patchFeedback({ status: newStatus })
    } catch (error) {
      const conflictError = error as Error & { code?: string; currentVersion?: string }
      const conflict = conflictError.code === 'EDIT_CONFLICT'
      if (conflict && conflictError.currentVersion) {
        feedbackVersionRef.current = conflictError.currentVersion
      }
      const message = conflict
        ? error instanceof Error ? error.message : 'This feedback changed in another tab.'
        : 'The status was not saved. Check your connection and try again.'
      toast({ title: 'Could not update status', description: message, variant: 'destructive' })
      setStatus(previousStatus)
      markError(message, () => handleStatusChange(newStatus))
      mutationInFlightRef.current = false
      return
    }
    announceFeedbackUpdate({
      status: newStatus,
      activity: liveActivity('status_changed', previousStatus, newStatus),
    })
    markSaved()
    if (newStatus !== 'new') {
      void fetch(`/api/projects/${projectId}/activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'first_feedback_triaged' }),
      })
    }
    mutationInFlightRef.current = false
  }

  const handlePriorityChange = async (newPriority: FeedbackPriority) => {
    if (mutationInFlightRef.current) return
    mutationInFlightRef.current = true
    const previousPriority = priority
    setPriority(newPriority)
    markSaving()
    try {
      await patchFeedback({ priority: newPriority })
    } catch (error) {
      const conflictError = error as Error & { code?: string; currentVersion?: string }
      const conflict = conflictError.code === 'EDIT_CONFLICT'
      if (conflict && conflictError.currentVersion) {
        feedbackVersionRef.current = conflictError.currentVersion
      }
      const message = conflict
        ? error instanceof Error ? error.message : 'This feedback changed in another tab.'
        : 'The priority was not saved. Check your connection and try again.'
      setPriority(previousPriority)
      markError(message, () => handlePriorityChange(newPriority))
      mutationInFlightRef.current = false
      return
    }
    announceFeedbackUpdate({
      priority: newPriority,
      activity: liveActivity('priority_changed', previousPriority, newPriority),
    })
    markSaved()
    mutationInFlightRef.current = false
  }

  React.useEffect(() => {
    const handleKeyboardAction = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.matches('input, textarea, select, button, [contenteditable="true"]')
      ) return
      const statusIndex = Number(event.key) - 1
      if (statusIndex >= 0 && statusIndex < statuses.length) {
        event.preventDefault()
        void handleStatusChange(statuses[statusIndex])
      }
    }
    window.addEventListener('keydown', handleKeyboardAction)
    return () => window.removeEventListener('keydown', handleKeyboardAction)
  })

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    markSaving()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: createdNote, error } = await supabase
      .from('feedback_notes')
      .insert({
        feedback_id: feedbackId,
        user_id: user!.id,
        content: note.trim(),
      })
      .select('*')
      .single()
    setSaving(false)
    if (error) {
      const message = 'The note was not added. Your draft is still here - try again.'
      toast({ title: 'Could not add note', description: message, variant: 'destructive' })
      markError(message, async () => {
        const form = document.querySelector<HTMLFormElement>('[data-note-form]')
        form?.requestSubmit()
      })
      return
    }
    markSaved()
    toast({ title: 'Note added' })
    if (createdNote) {
      announceFeedbackUpdate({
        note: createdNote,
        activity: liveActivity('note_added', null, null),
      })
    }
    setNote('')
  }

  const updateTags = async (nextTags: string[], title: string) => {
    if (mutationInFlightRef.current) return
    mutationInFlightRef.current = true
    setTagSaving(true)
    markSaving()
    let updateError: unknown = null
    try {
      await patchFeedback({ tags: nextTags })
    } catch (error) {
      updateError = error
    }
    setTagSaving(false)
    if (updateError) {
      const conflictError = updateError as Error & { code?: string; currentVersion?: string }
      const conflict = conflictError.code === 'EDIT_CONFLICT'
      if (conflict && conflictError.currentVersion) {
        feedbackVersionRef.current = conflictError.currentVersion
      }
      const message = conflict && updateError instanceof Error
        ? updateError.message
        : 'The tag change was not saved. Try again.'
      toast({ title: 'Could not update tags', description: message, variant: 'destructive' })
      markError(message, () => updateTags(nextTags, title))
      mutationInFlightRef.current = false
      return
    }
    setTags(nextTags)
    announceFeedbackUpdate({
      tags: nextTags,
      activity: liveActivity('tags_changed', tags, nextTags),
    })
    markSaved()
    toast({ title })
    mutationInFlightRef.current = false
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextTag = normalizeTag(tagInput)
    if (!nextTag) return
    if (tags.includes(nextTag)) {
      setTagInput('')
      return
    }
    if (tags.length >= 10) {
      toast({ title: 'Tag limit reached', description: 'Each feedback item supports up to 10 tags.', variant: 'destructive' })
      return
    }
    await updateTags([...tags, nextTag], 'Tag added')
    setTagInput('')
  }

  return (
    <div className="space-y-4">
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-8 items-center justify-between gap-3 rounded-md bg-surface-raised px-3 py-2 text-xs"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          {saveState === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saveState === 'saved' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          {saveState === 'error' && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? saveError
                : 'Changes save when you choose an option.'}
        </span>
        {saveState === 'error' && lastRetry && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void lastRetry()}>
            Retry
          </Button>
        )}
      </div>

      {/* Status changer */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="status-select" className="mb-2 block text-xs font-medium text-muted-foreground">
            Status <span className="font-normal">(keys 1–5)</span>
          </Label>
          <select
            id="status-select"
            aria-label="Change feedback status"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={status}
            disabled={saveState === 'saving'}
            onChange={(e) => void handleStatusChange(e.target.value as FeedbackStatus)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="priority-select" className="mb-2 block text-xs font-medium text-muted-foreground">
            Priority
          </Label>
          <select
            id="priority-select"
            aria-label="Change feedback priority"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={priority}
            disabled={saveState === 'saving'}
            onChange={(e) => void handlePriorityChange(e.target.value as FeedbackPriority)}
          >
            {(['low', 'medium', 'high', 'critical'] as FeedbackPriority[]).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="block text-xs font-medium text-muted-foreground">
          Tags
        </Label>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs"
              >
                <Badge variant="outline" className="border-0 px-0 py-0 text-xs font-normal">
                  {tag}
                </Badge>
                <button
                  type="button"
                  onClick={() => void updateTags(tags.filter((currentTag) => currentTag !== tag), 'Tag removed')}
                  className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove tag ${tag}`}
                  disabled={tagSaving || saveState === 'saving'}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        )}

        <form onSubmit={handleAddTag} className="flex gap-2">
          <Input
            placeholder="Add tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={tagSaving || saveState === 'saving' || !tagInput.trim()}>
            {tagSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Add tag
          </Button>
        </form>
        {suggestedTags.filter((tag) => !tags.includes(tag)).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Suggested:</span>
            {suggestedTags.filter((tag) => !tags.includes(tag)).slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                disabled={tagSaving || saveState === 'saving'}
                onClick={() => void updateTags([...tags, tag], 'Tag added')}
                className="rounded-full border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add note */}
      <form data-note-form onSubmit={handleAddNote} className="space-y-2">
        <Textarea
          placeholder="Add an internal note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <Button type="submit" size="sm" disabled={saving || !note.trim()}>
          {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Add Note
        </Button>
      </form>

      {/* Archive */}
      <div className="border-t pt-4">
        {archived ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-surface-raised p-3">
            <p className="text-sm">Feedback archived.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={archiving || saveState === 'saving'}
                onClick={async () => {
                  if (mutationInFlightRef.current) return
                  mutationInFlightRef.current = true
                  setArchiving(true)
                  markSaving()
                  let undoError: unknown = null
                  try {
                    await patchFeedback({ isArchived: false })
                  } catch (error) {
                    undoError = error
                  }
                  setArchiving(false)
                  if (undoError) {
                    markError('The archive could not be undone. Try again.', async () => undefined)
                    mutationInFlightRef.current = false
                    return
                  }
                  setArchived(false)
                  announceFeedbackUpdate({
                    activity: liveActivity('restored', true, false),
                  })
                  markSaved()
                  mutationInFlightRef.current = false
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Undo
              </Button>
              <Button size="sm" onClick={() => router.push('/feedback')}>Back to inbox</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            disabled={archiving || saveState === 'saving'}
            onClick={async () => {
              if (mutationInFlightRef.current) return
              mutationInFlightRef.current = true
              setArchiving(true)
              markSaving()
              let archiveError: unknown = null
              try {
                await patchFeedback({ isArchived: true })
              } catch (error) {
                archiveError = error
              }
              setArchiving(false)
              if (archiveError) {
                markError('The feedback was not archived. Try again.', async () => undefined)
                mutationInFlightRef.current = false
                return
              }
              setArchived(true)
              announceFeedbackUpdate({
                activity: liveActivity('archived', false, true),
              })
              markSaved()
              mutationInFlightRef.current = false
            }}
          >
            {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
            Archive
          </Button>
        )}
      </div>
    </div>
  )
}
