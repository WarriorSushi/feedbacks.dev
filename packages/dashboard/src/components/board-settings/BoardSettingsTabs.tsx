'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { BoardReport, Project } from '@/lib/types'
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BoardIdentitySection } from './BoardIdentitySection'
import { BoardContentSection } from './BoardContentSection'
import { BoardVisibilitySection } from './BoardVisibilitySection'
import { BoardAdvancedSection } from './BoardAdvancedSection'

interface BoardSettingsState {
  id?: string
  enabled: boolean
  slug: string
  display_name: string
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

type TabId = 'identity' | 'content' | 'visibility' | 'advanced'

const TABS: { id: TabId; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'content', label: 'Content' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'advanced', label: 'Advanced' },
]

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
    display_name: project.name,
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

interface BoardSettingsTabsProps {
  project: Project
}

export function BoardSettingsTabs({ project }: BoardSettingsTabsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabId>('identity')
  const [settings, setSettings] = React.useState<BoardSettingsState>(createDefaultSettings(project))
  const [reports, setReports] = React.useState<BoardReport[]>([])
  const [stats, setStats] = React.useState<BoardStats>({ followerCount: 0, watchCount: 0, openReportCount: 0 })
  const [reportBusyId, setReportBusyId] = React.useState<string | null>(null)
  const slugManuallyEdited = React.useRef(false)

  React.useEffect(() => {
    async function load() {
      const response = await fetch(`/api/projects/${project.id}/board`, { cache: 'no-store' })
      const data = await response.json().catch(() => null)

      if (response.ok && data?.board) {
        const defaults = createDefaultSettings(project)
        setSettings({
          id: data.board.id,
          enabled: data.board.enabled,
          slug: data.board.slug,
          display_name: data.board.display_name || '',
          title: data.board.title || '',
          description: data.board.description || '',
          show_types: data.board.show_types || ['idea', 'bug'],
          allow_submissions: data.board.allow_submissions,
          require_email_to_vote: data.board.require_email_to_vote,
          custom_css: data.board.custom_css || '',
          branding: {
            ...defaults.branding,
            ...data.board.profile,
          },
          announcements: data.board.announcements || [],
        })
        setReports(data.reports || [])
        setStats(data.stats || { followerCount: 0, watchCount: 0, openReportCount: 0 })

        // If there's already a slug, assume it was manually set
        if (data.board.slug) {
          slugManuallyEdited.current = true
        }
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

  const updateSettings = (patch: Partial<BoardSettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const updateBranding = (patch: Partial<BoardBranding>) => {
    setSettings((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...patch },
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
        display_name: settings.display_name,
        title: settings.title,
        description: settings.description,
        show_types: settings.show_types,
        allow_submissions: settings.allow_submissions,
        require_email_to_vote: settings.require_email_to_vote,
        custom_css: settings.custom_css,
        branding: {
          ...settings.branding,
          displayName: settings.display_name,
        },
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
      const defaults = createDefaultSettings(project)
      setSettings({
        id: payload.board.id,
        enabled: payload.board.enabled,
        slug: payload.board.slug,
        display_name: payload.board.display_name || '',
        title: payload.board.title || '',
        description: payload.board.description || '',
        show_types: payload.board.show_types || ['idea', 'bug'],
        allow_submissions: payload.board.allow_submissions,
        require_email_to_vote: payload.board.require_email_to_vote,
        custom_css: payload.board.custom_css || '',
        branding: {
          ...defaults.branding,
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
      {/* Header: status badges + live link + stats */}
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

          {settings.enabled && !isPrivate && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <span className="flex-1 truncate font-mono text-sm">{boardUrl}</span>
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
        </CardHeader>
      </Card>

      {/* Stats cards */}
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

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-full border bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'identity' && (
        <BoardIdentitySection
          settings={settings}
          onSettingsChange={updateSettings}
          onBrandingChange={updateBranding}
          slugManuallyEdited={slugManuallyEdited}
        />
      )}

      {activeTab === 'content' && (
        <BoardContentSection
          settings={settings}
          onSettingsChange={updateSettings}
          onBrandingChange={updateBranding}
          onAnnouncementUpdate={updateAnnouncement}
          onAnnouncementAdd={addAnnouncement}
          onAnnouncementRemove={removeAnnouncement}
        />
      )}

      {activeTab === 'visibility' && (
        <BoardVisibilitySection
          settings={settings}
          onSettingsChange={updateSettings}
          onBrandingChange={updateBranding}
        />
      )}

      {activeTab === 'advanced' && (
        <BoardAdvancedSection
          settings={settings}
          onSettingsChange={updateSettings}
          reports={reports}
          reportBusyId={reportBusyId}
          onReportStatusUpdate={updateReportStatus}
        />
      )}

      {/* Save button */}
      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Board Settings
      </Button>
    </div>
  )
}
