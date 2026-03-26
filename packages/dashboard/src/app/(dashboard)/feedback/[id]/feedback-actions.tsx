'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FeedbackStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Loader2, Archive, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const statuses: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']

interface FeedbackActionsProps {
  feedbackId: string
  currentStatus: FeedbackStatus
  currentTags: string[] | null
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function FeedbackActions({ feedbackId, currentStatus, currentTags }: FeedbackActionsProps) {
  const [status, setStatus] = React.useState(currentStatus)
  const [note, setNote] = React.useState('')
  const [tags, setTags] = React.useState<string[]>(currentTags || [])
  const [tagInput, setTagInput] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [tagSaving, setTagSaving] = React.useState(false)
  const [archiving, setArchiving] = React.useState(false)
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  React.useEffect(() => {
    setTags(currentTags || [])
  }, [currentTags])

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setStatus(newStatus)
    const { error } = await supabase
      .from('feedback')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'closed' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', feedbackId)
    if (error) {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' })
      setStatus(currentStatus)
      return
    }
    toast({ title: 'Status updated' })
    router.refresh()
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('feedback_notes').insert({
      feedback_id: feedbackId,
      user_id: user!.id,
      content: note.trim(),
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Failed to add note', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Note added' })
    setNote('')
    router.refresh()
  }

  const updateTags = async (nextTags: string[], title: string) => {
    setTagSaving(true)
    const { error } = await supabase
      .from('feedback')
      .update({
        tags: nextTags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)
    setTagSaving(false)
    if (error) {
      toast({ title: 'Failed to update tags', description: error.message, variant: 'destructive' })
      return
    }
    setTags(nextTags)
    toast({ title })
    router.refresh()
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
      {/* Status changer */}
      <div>
        <Label htmlFor="status-select" className="mb-2 block text-xs font-medium text-muted-foreground">
          Change Status
        </Label>
        <select
          id="status-select"
          aria-label="Change feedback status"
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
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
                  disabled={tagSaving}
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
          <Button type="submit" size="sm" disabled={tagSaving || !tagInput.trim()}>
            {tagSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Add tag
          </Button>
        </form>
      </div>

      {/* Add note */}
      <form onSubmit={handleAddNote} className="space-y-2">
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-destructive"
          disabled={archiving}
          onClick={async () => {
            setArchiving(true)
            const { error } = await supabase
              .from('feedback')
              .update({ is_archived: true, updated_at: new Date().toISOString() })
              .eq('id', feedbackId)
            setArchiving(false)
            if (error) {
              toast({ title: 'Failed to archive', description: error.message, variant: 'destructive' })
              return
            }
            toast({ title: 'Feedback archived' })
            router.push('/feedback')
          }}
        >
          {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
          Archive
        </Button>
      </div>
    </div>
  )
}
