'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { BoardReport, Project } from '@/lib/types'
import type { BoardAnnouncement, BoardBranding, BoardVisibility } from '@/lib/public-board'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface BoardSettingsProps {
  project: Project
}

interface BoardSettingsState {
  id?: string
  enabled: boolean
  slug: string
  title: string
  description: string
  show_types: string[]
  allow_submissions: boolean
  require_email_to_vote: boolean
  custom_css: string
  branding: BoardBranding
  announcements: BoardAnnouncement[]
}

interface BoardStats {
  followerCount: number
  watchCount: number
  openReportCount: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function createDefaultSettings(project: Project): BoardSettingsState {
  return {
    enabled: false,
    slug: slugify(project.name),
    title: `${project.name} Feedback`,
    description: 'Share requests, vote on what matters, and follow product updates in one place.',
    show_types: ['idea', 'bug'],
    allow_submissions: true,
    require_email_to_vote: false,
    custom_css: '',
    branding: {
      visibility: 'public',
      directoryOptIn: true,
      accentColor: '#0f766e',
      logoEmoji: '◦',
      heroEyebrow: 'Public board',
      heroTitle: `${project.name} roadmap and feedback`,
      heroDescription: 'Track what the team is building, vote on requests, and see public updates without the noise of a bloated portal.',
      tagline: `${project.name} keeps feedback visible and actionable.`,
      categories: [],
      emptyStateTitle: 'No requests yet',
      emptyStateDescription: 'Start the conversation by submitting the first request or sharing a bug report.',
    },
    announcements: [],
  }
}

function createAnnouncement(): BoardAnnouncement {
  return {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `announcement-${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    body: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    href: '',
  }
}

export function BoardSettingsTab({ project }: BoardSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [settings, setSettings] = React.useState<BoardSettingsState>(createDefaultSettings(project))
  const [reports, setReports] = React.useState<BoardReport[]>([])
  const [stats, setStats] = React.useState<BoardStats>({ followerCount: 0, watchCount: 0, openReportCount: 0 })
  const [reportBusyId, setReportBusyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      const response = await fetch(`/api/projects/${project.id}/board`, { cache: 'no-store' })
      const data = await response.json().catch(() => null)

      if (response.ok && data?.board) {
        setSettings({
          id: data.board.id,
          enabled: data.board.enabled,
          slug: data.board.slug,
          title: data.board.title || '',
          description: data.board.description || '',
          show_types: data.board.show_types || ['idea', 'bug'],
          allow_submissions: data.board.allow_submissions,
          require_email_to_vote: data.board.require_email_to_vote,
          custom_css: data.board.custom_css || '',
          branding: {
            ...createDefaultSettings(project).branding,
            ...data.board.profile,
          },
          announcements: data.board.announcements || [],
        })
        setReports(data.reports || [])
        setStats(data.stats || { followerCount: 0, watchCount: 0, openReportCount: 0 })
      }

      setLoading(false)
    }

    void load()
  }, [project])

  const boardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${settings.slug}`
    : `/p/${settings.slug}`
  const isPrivate = (settings.branding.visibility || 'public') === 'private'
  const isListed = (settings.branding.visibility || 'public') === 'public' && settings.branding.directoryOptIn !== false

  const updateBranding = (patch: Partial<BoardBranding>) => {
    setSettings((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        ...patch,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    const response = await fetch(`/api/projects/${project.id}/board`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: settings.id,
        enabled: settings.enabled,
        slug: settings.slug,
        title: settings.title,
        description: settings.description,
        show_types: settings.show_types,
        allow_submissions: settings.allow_submissions,
        require_email_to_vote: settings.require_email_to_vote,
        custom_css: settings.custom_css,
        branding: settings.branding,
        announcements: settings.announcements,
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      toast({ title: 'Failed to save board settings', description: payload?.error || 'Please try again.', variant: 'destructive' })
      setSaving(false)
      return
    }

    if (payload?.board) {
      setSettings({
        id: payload.board.id,
        enabled: payload.board.enabled,
        slug: payload.board.slug,
        title: payload.board.title || '',
        description: payload.board.description || '',
        show_types: payload.board.show_types || ['idea', 'bug'],
        allow_submissions: payload.board.allow_submissions,
        require_email_to_vote: payload.board.require_email_to_vote,
        custom_css: payload.board.custom_css || '',
        branding: {
          ...createDefaultSettings(project).branding,
          ...payload.board.profile,
        },
        announcements: payload.board.announcements || [],
      })
      setReports(payload.reports || [])
      setStats(payload.stats || { followerCount: 0, watchCount: 0, openReportCount: 0 })
    }

    toast({ title: 'Board settings saved' })
    setSaving(false)
    router.refresh()
  }

  const copyUrl = async () => {
    await navigator.clipboard.writeText(boardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleType = (type: string) => {
    setSettings((prev) => ({
      ...prev,
      show_types: prev.show_types.includes(type)
        ? prev.show_types.filter((entry) => entry !== type)
        : [...prev.show_types, type],
    }))
  }

  const updateAnnouncement = (index: number, patch: Partial<BoardAnnouncement>) => {
    const nextAnnouncements = [...settings.announcements]
    nextAnnouncements[index] = { ...nextAnnouncements[index], ...patch }
    setSettings((prev) => ({ ...prev, announcements: nextAnnouncements }))
  }

  const addAnnouncement = () => {
    setSettings((prev) => ({
      ...prev,
      announcements: [...prev.announcements, createAnnouncement()],
    }))
  }

  const removeAnnouncement = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const formatReportTarget = (report: BoardReport) => report.target_type === 'board'
    ? 'Board report'
    : `Post report${report.feedback_id ? ` • ${report.feedback_id.slice(0, 8)}` : ''}`

  const formatReportDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const updateReportStatus = async (reportId: string, status: BoardReport['status']) => {
    setReportBusyId(reportId)

    const response = await fetch(`/api/projects/${project.id}/board/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.report) {
      toast({
        title: 'Failed to update report',
        description: payload?.error || 'Please try again.',
        variant: 'destructive',
      })
      setReportBusyId(null)
      return
    }

    setReports((prev) => prev.map((report) => (
      report.id === reportId
        ? payload.report as BoardReport
        : report
    )))
    setStats((prev) => {
      const current = reports.find((report) => report.id === reportId)
      const closesOpen = current?.status === 'open' && status !== 'open'
      const reopens = current?.status !== 'open' && status === 'open'
      return {
        ...prev,
        openReportCount: closesOpen
          ? Math.max(0, prev.openReportCount - 1)
          : reopens
            ? prev.openReportCount + 1
            : prev.openReportCount,
      }
    })
    toast({ title: 'Report updated' })
    setReportBusyId(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={settings.enabled ? 'secondary' : 'outline'}>
              {settings.enabled ? 'Board enabled' : 'Board disabled'}
            </Badge>
            <Badge variant="outline">
              {(settings.branding.visibility || 'public') === 'public'
                ? 'Public'
                : (settings.branding.visibility || 'public') === 'unlisted'
                  ? 'Unlisted'
                  : 'Private'}
            </Badge>
            {isListed && <Badge variant="outline">Listed in directory</Badge>}
          </div>
          <CardTitle className="mt-3 text-lg">Public board settings</CardTitle>
          <CardDescription>
            Shape the board into a lightweight product hub: public feedback, updates, and product context without turning setup into an enterprise control panel.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{stats.followerCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Signed-in users following this board.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Watched posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{stats.watchCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Account-backed watches on public requests.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Open reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{stats.openReportCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">First-party abuse or trust reports awaiting review.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board basics</CardTitle>
          <CardDescription>Turn the board on, choose the URL, and set the public framing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border"
            />
            Make this board publicly available
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Board URL slug</Label>
              <div className="flex gap-2">
                <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  /p/
                </div>
                <Input
                  value={settings.slug}
                  onChange={(e) => setSettings((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="my-product"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={settings.branding.websiteUrl || ''}
                onChange={(e) => updateBranding({ websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Board title</Label>
              <Input
                value={settings.title}
                onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={settings.branding.tagline || ''}
                onChange={(e) => updateBranding({ tagline: e.target.value })}
                placeholder="Dependable product updates for your users"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {settings.enabled && !isPrivate && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <span className="flex-1 truncate text-sm font-mono">{boardUrl}</span>
              <Button size="sm" variant="outline" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={boardUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discovery and visibility</CardTitle>
          <CardDescription>Control whether the board is public, unlisted, or kept private while you set it up.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <select
              value={settings.branding.visibility || 'public'}
              onChange={(e) => updateBranding({ visibility: e.target.value as BoardVisibility })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Public boards appear in discovery. Unlisted boards work via direct URL only. Private hides the board route until you are ready.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <Input
              value={settings.branding.categories?.join(', ') || ''}
              onChange={(e) =>
                updateBranding({
                  categories: e.target.value
                    .split(',')
                    .map((entry) => entry.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
              placeholder="saas, developer-tools, analytics"
            />
          </div>

          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={settings.branding.directoryOptIn !== false}
              onChange={(e) => updateBranding({ directoryOptIn: e.target.checked })}
              className="h-4 w-4 rounded border"
            />
            Include this board in the public directory when visibility is public
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board presentation</CardTitle>
          <CardDescription>Give the board a clearer voice without making it decorative for its own sake.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.branding.accentColor || '#0f766e'}
                  onChange={(e) => updateBranding({ accentColor: e.target.value })}
                  className="h-10 w-10 rounded border"
                />
                <Input
                  value={settings.branding.accentColor || ''}
                  onChange={(e) => updateBranding({ accentColor: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo emoji</Label>
              <Input
                value={settings.branding.logoEmoji || ''}
                onChange={(e) => updateBranding({ logoEmoji: e.target.value })}
                placeholder="◦"
              />
            </div>
            <div className="space-y-2">
              <Label>Hero eyebrow</Label>
              <Input
                value={settings.branding.heroEyebrow || ''}
                onChange={(e) => updateBranding({ heroEyebrow: e.target.value })}
                placeholder="Public board"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Hero title</Label>
              <Input
                value={settings.branding.heroTitle || ''}
                onChange={(e) => updateBranding({ heroTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empty state title</Label>
              <Input
                value={settings.branding.emptyStateTitle || ''}
                onChange={(e) => updateBranding({ emptyStateTitle: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Hero description</Label>
              <textarea
                value={settings.branding.heroDescription || ''}
                onChange={(e) => updateBranding({ heroDescription: e.target.value })}
                rows={4}
                className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Empty state description</Label>
              <textarea
                value={settings.branding.emptyStateDescription || ''}
                onChange={(e) => updateBranding({ emptyStateDescription: e.target.value })}
                rows={4}
                className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participation and updates</CardTitle>
          <CardDescription>Decide what kinds of posts appear and publish a small stream of announcements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Feedback types to show</Label>
            <div className="flex flex-wrap gap-3">
              {(['idea', 'bug', 'praise', 'question'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.show_types.includes(type)}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="capitalize">{type === 'idea' ? 'Feature requests' : type}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allow_submissions}
              onChange={(e) => setSettings((prev) => ({ ...prev, allow_submissions: e.target.checked }))}
              className="h-4 w-4 rounded border"
            />
            Allow public submissions on the board
          </label>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Announcements</Label>
                <p className="text-xs text-muted-foreground">
                  Lightweight changelog items that appear on the public board.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addAnnouncement}>
                <Plus className="mr-2 h-4 w-4" />
                Add announcement
              </Button>
            </div>

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
                      onChange={(e) => updateAnnouncement(index, { title: e.target.value })}
                      placeholder="Shipping widget verification page"
                    />
                    <Input
                      type="date"
                      value={announcement.publishedAt.slice(0, 10)}
                      onChange={(e) => updateAnnouncement(index, { publishedAt: e.target.value })}
                    />
                  </div>
                  <textarea
                    value={announcement.body}
                    onChange={(e) => updateAnnouncement(index, { body: e.target.value })}
                    rows={3}
                    className="min-h-[88px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Short public update about what changed and why it matters."
                  />
                  <div className="flex flex-wrap gap-3">
                    <Input
                      value={announcement.href || ''}
                      onChange={(e) => updateAnnouncement(index, { href: e.target.value })}
                      placeholder="Optional link"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeAnnouncement(index)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced</CardTitle>
          <CardDescription>Optional CSS overrides for teams that need a final layer of polish.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={settings.custom_css}
            onChange={(e) => setSettings((prev) => ({ ...prev, custom_css: e.target.value }))}
            rows={6}
            className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
            placeholder=".feedbacks-board { --feedbacks-accent: #0f766e; }"
          />
          <p className="text-xs text-muted-foreground">
            Custom CSS is sanitized on read before it reaches the public board. Keep overrides small and focused on clarity.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports and trust queue</CardTitle>
          <CardDescription>
            Board and post reports now stay inside the product instead of routing through mailto links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No reports yet. When someone flags the board or a post, it will show up here.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatReportTarget(report)}</p>
                    <p className="text-xs text-muted-foreground">{formatReportDate(report.created_at)}</p>
                  </div>
                  <Badge variant={report.status === 'open' ? 'secondary' : 'outline'}>{report.status}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">{report.reason}</p>
                {report.details && <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>}
                {report.reporter_email && (
                  <p className="mt-2 text-xs text-muted-foreground">Reporter: {report.reporter_email}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={report.status === 'reviewed' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => void updateReportStatus(report.id, 'reviewed')}
                  >
                    {reportBusyId === report.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Mark reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant={report.status === 'resolved' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => void updateReportStatus(report.id, 'resolved')}
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant={report.status === 'dismissed' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => void updateReportStatus(report.id, 'dismissed')}
                  >
                    Dismiss
                  </Button>
                  {report.status !== 'open' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={reportBusyId === report.id}
                      onClick={() => void updateReportStatus(report.id, 'open')}
                    >
                      Re-open
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Board Settings
      </Button>
    </div>
  )
}
