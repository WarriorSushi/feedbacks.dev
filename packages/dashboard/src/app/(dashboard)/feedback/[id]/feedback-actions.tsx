'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { FeedbackStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const statuses: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']

interface FeedbackActionsProps {
  feedbackId: string
  currentStatus: FeedbackStatus
}

export function FeedbackActions({ feedbackId, currentStatus }: FeedbackActionsProps) {
  const [status, setStatus] = React.useState(currentStatus)
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setStatus(newStatus)
    await supabase
      .from('feedbacks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'closed' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', feedbackId)
    router.refresh()
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('feedback_notes').insert({
      feedback_id: feedbackId,
      user_id: user!.id,
      content: note.trim(),
    })
    setNote('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Status changer */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Change Status
        </label>
        <select
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
    </div>
  )
}
