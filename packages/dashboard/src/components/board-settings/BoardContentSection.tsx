'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'

interface BoardContentSettings {
  title: string
  description: string
  show_types: string[]
  allow_submissions: boolean
  branding: BoardBranding
  announcements: BoardAnnouncement[]
}

interface BoardContentSectionProps {
  settings: BoardContentSettings
  onSettingsChange: (patch: Partial<BoardContentSettings>) => void
  onBrandingChange: (patch: Partial<BoardBranding>) => void
  onAnnouncementUpdate: (index: number, patch: Partial<BoardAnnouncement>) => void
  onAnnouncementAdd: () => void
  onAnnouncementRemove: (index: number) => void
}

const FEEDBACK_TYPES = [
  { value: 'idea', label: 'Feature requests' },
  { value: 'bug', label: 'Bug' },
  { value: 'praise', label: 'Praise' },
  { value: 'question', label: 'Question' },
] as const

export function BoardContentSection({
  settings,
  onSettingsChange,
  onBrandingChange,
  onAnnouncementUpdate,
  onAnnouncementAdd,
  onAnnouncementRemove,
}: BoardContentSectionProps) {
  const toggleType = (type: string) => {
    const next = settings.show_types.includes(type)
      ? settings.show_types.filter((entry) => entry !== type)
      : [...settings.show_types, type]
    onSettingsChange({ show_types: next })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero and copy</CardTitle>
          <CardDescription>The text visitors see when they land on your board.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Hero eyebrow</Label>
              <Input
                value={settings.branding.heroEyebrow || ''}
                onChange={(e) => onBrandingChange({ heroEyebrow: e.target.value })}
                placeholder="Public board"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Hero title</Label>
              <Input
                value={settings.branding.heroTitle || ''}
                onChange={(e) => onBrandingChange({ heroTitle: e.target.value })}
                placeholder="Roadmap and feedback"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hero description</Label>
            <textarea
              value={settings.branding.heroDescription || ''}
              onChange={(e) => onBrandingChange({ heroDescription: e.target.value })}
              rows={3}
              className="min-h-[88px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Track what the team is building, vote on requests, and see public updates."
            />
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={settings.branding.tagline || ''}
              onChange={(e) => onBrandingChange({ tagline: e.target.value })}
              placeholder="Dependable product updates for your users"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Empty state title</Label>
              <Input
                value={settings.branding.emptyStateTitle || ''}
                onChange={(e) => onBrandingChange({ emptyStateTitle: e.target.value })}
                placeholder="No requests yet"
              />
            </div>
            <div className="space-y-2">
              <Label>Empty state description</Label>
              <Input
                value={settings.branding.emptyStateDescription || ''}
                onChange={(e) => onBrandingChange({ emptyStateDescription: e.target.value })}
                placeholder="Start the conversation by submitting the first request."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participation</CardTitle>
          <CardDescription>Decide what kinds of posts appear and whether visitors can submit feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Feedback types to show</Label>
            <div className="flex flex-wrap gap-3">
              {FEEDBACK_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.show_types.includes(type.value)}
                    onChange={() => toggleType(type.value)}
                    className="h-4 w-4 rounded border"
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allow_submissions}
              onChange={(e) => onSettingsChange({ allow_submissions: e.target.checked })}
              className="h-4 w-4 rounded border"
            />
            Allow public submissions on the board
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Announcements</CardTitle>
              <CardDescription>
                Lightweight changelog items that appear on the public board.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onAnnouncementAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No announcements yet. Add one when you ship something meaningful or want to set expectations publicly.
            </div>
          ) : (
            settings.announcements.map((announcement, index) => (
              <div key={announcement.id} className="space-y-3 rounded-lg border p-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                  <Input
                    value={announcement.title}
                    onChange={(e) => onAnnouncementUpdate(index, { title: e.target.value })}
                    placeholder="Shipping widget verification page"
                  />
                  <Input
                    type="date"
                    value={announcement.publishedAt.slice(0, 10)}
                    onChange={(e) => onAnnouncementUpdate(index, { publishedAt: e.target.value })}
                  />
                </div>
                <textarea
                  value={announcement.body}
                  onChange={(e) => onAnnouncementUpdate(index, { body: e.target.value })}
                  rows={3}
                  className="min-h-[88px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Short public update about what changed and why it matters."
                />
                <div className="flex flex-wrap gap-3">
                  <Input
                    value={announcement.href || ''}
                    onChange={(e) => onAnnouncementUpdate(index, { href: e.target.value })}
                    placeholder="Optional link"
                  />
                  <Button variant="ghost" size="sm" onClick={() => onAnnouncementRemove(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
