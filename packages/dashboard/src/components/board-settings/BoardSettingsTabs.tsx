'use client'

import * as React from 'react'
import type { BoardReport, Project } from '@/lib/types'
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/copy-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Loader2, PanelsTopLeft, Rocket } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BoardIdentitySection } from './BoardIdentitySection'
import { BoardContentSection } from './BoardContentSection'
import { BoardVisibilitySection } from './BoardVisibilitySection'
import { BoardAdvancedSection } from './BoardAdvancedSection'
import { PageHeader } from '@/components/ui/workspace-shell'
import { getMarketingOrigin } from '@/lib/domain-routing'
import { FormErrorSummary } from '@/components/ui/field-error'
import { readErrorMessage, readFieldErrors, type FieldErrors } from '@/lib/form-errors'

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
  { id: 'identity', label: 'Name and look' },
  { id: 'content', label: 'Page content' },
  { id: 'visibility', label: 'Who can see it' },
  { id: 'advanced', label: 'Safety' },
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
    description: 'Share an idea, vote, and see what the team says.',
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
      heroTitle: `Help shape ${project.name}`,
      heroDescription: 'Share an idea or bug. Vote for things you want. See what the team plans to do.',
      tagline: 'Your ideas help us build better.',
      categories: [],
      emptyStateTitle: 'No requests yet',
      emptyStateDescription: 'Be the first to share an idea or bug.',
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
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState('')
  const [reloadKey, setReloadKey] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabId>('identity')
  const [settings, setSettings] = React.useState<BoardSettingsState>(createDefaultSettings(project))
  const [reports, setReports] = React.useState<BoardReport[]>([])
  const [stats, setStats] = React.useState<BoardStats>({ followerCount: 0, watchCount: 0, openReportCount: 0 })
  const [reportBusyId, setReportBusyId] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const slugManuallyEdited = React.useRef(false)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch(`/api/projects/${project.id}/board`, { cache: 'no-store' })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setLoadError(readErrorMessage(data, 'Board settings could not be loaded. Check your connection and try again.'))
          return
        }

        if (data?.board) {
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

          if (data.board.slug) {
            slugManuallyEdited.current = true
          }
        }
      } catch {
        setLoadError('Board settings could not be loaded. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [project, reloadKey])

  const boardOrigin = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? window.location.origin
    : getMarketingOrigin()
  const boardUrl = `${boardOrigin}/p/${settings.slug}`
  const isLegacyPrivate = settings.branding.visibility === 'private'
  const isListed = (settings.branding.visibility || 'public') === 'public' && settings.branding.directoryOptIn !== false
  const canOpenBoard = settings.enabled && !isLegacyPrivate
  const updateSettings = (patch: Partial<BoardSettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    setFieldErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => { delete next[key] })
      return next
    })
  }

  const updateBranding = (patch: Partial<BoardBranding>) => {
    setSettings((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...patch },
    }))
  }

  const persistSettings = async (
    nextSettings: BoardSettingsState,
    successTitle = 'Board settings saved',
  ) => {
    setSaving(true)
    setSaveError('')
    setFieldErrors({})

    try {
      const response = await fetch(`/api/projects/${project.id}/board`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nextSettings.id,
          enabled: nextSettings.enabled,
          slug: nextSettings.slug,
          display_name: nextSettings.display_name,
          title: nextSettings.title,
          description: nextSettings.description,
          show_types: nextSettings.show_types,
          allow_submissions: nextSettings.allow_submissions,
          require_email_to_vote: nextSettings.require_email_to_vote,
          custom_css: nextSettings.custom_css,
          branding: {
            ...nextSettings.branding,
            displayName: nextSettings.display_name,
          },
          announcements: nextSettings.announcements,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const nextFieldErrors = readFieldErrors(payload)
        setFieldErrors(nextFieldErrors)
        setSaveError(readErrorMessage(payload, 'Board settings could not be saved. Check your connection and try again.'))
        if (nextFieldErrors.slug || nextFieldErrors.display_name || nextFieldErrors.websiteUrl || nextFieldErrors.accentColor) setActiveTab('identity')
        else if (nextFieldErrors.custom_css) setActiveTab('advanced')
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

      toast({ title: successTitle })
    } catch {
      setSaveError('Board settings could not be saved. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    await persistSettings(settings)
  }

  const handleEnableAndSave = async () => {
    const nextSettings = {
      ...settings,
      enabled: true,
      branding: {
        ...settings.branding,
        visibility: isListed ? ('public' as const) : ('unlisted' as const),
      },
    }
    setSettings(nextSettings)
    await persistSettings(nextSettings, 'Public board enabled')
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

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <p className="text-lg font-semibold text-foreground">Board settings are unavailable</p>
          <p role="alert" className="mt-2 text-sm text-destructive">{loadError}</p>
        </CardHeader>
        <CardContent><Button onClick={() => setReloadKey((value) => value + 1)}>Try again</Button></CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={project.name}
        title="Public feedback page"
        description="Give users one place to share ideas, vote, and see your replies."
        meta={
          <div className="flex flex-wrap items-center gap-2">
                <Badge variant={canOpenBoard ? 'secondary' : 'outline'}>
                  {canOpenBoard ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">
                  {isListed ? 'Listed' : 'Unlisted'}
                </Badge>
          </div>
        }
        action={
          <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/boards" target="_blank" rel="noopener noreferrer">
                  <PanelsTopLeft className="mr-2 h-4 w-4" />
                  Browse public boards
                </a>
              </Button>
              {!canOpenBoard && (
                <Button onClick={() => void handleEnableAndSave()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                  Publish page
                </Button>
              )}
              <CopyButton value={boardUrl} label="Copy link" copiedLabel="Copied" variant="outline" disabled={!settings.slug} />
              {canOpenBoard ? (
                <Button variant="outline" asChild>
                  <a href={boardUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open page
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open page
                </Button>
              )}
          </div>
        }
      />
      <div className="flex flex-col gap-3 rounded-lg border bg-surface-raised/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{boardUrl}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span><strong className="font-semibold text-foreground">{stats.followerCount}</strong> followers</span>
              <span><strong className="font-semibold text-foreground">{stats.watchCount}</strong> watched posts</span>
              <span><strong className="font-semibold text-foreground">{stats.openReportCount}</strong> reports to check</span>
            </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto rounded-lg border bg-[oklch(var(--surface-raised))] p-1.5 scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'min-h-10 shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-border bg-card text-foreground shadow-sm'
                : 'border-transparent text-muted-foreground hover:bg-card/55 hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.id === 'advanced' && stats.openReportCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                {stats.openReportCount}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'identity' && (
        <BoardIdentitySection
          projectId={project.id}
          boardUrl={boardUrl}
          settings={settings}
          onSettingsChange={updateSettings}
          onBrandingChange={updateBranding}
          slugManuallyEdited={slugManuallyEdited}
          fieldErrors={fieldErrors}
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
          fieldErrors={fieldErrors}
        />
      )}

      <div className="sticky bottom-4 rounded-lg border bg-card p-3 shadow-[var(--shadow-float)]">
        <FormErrorSummary className="mb-3">{saveError}</FormErrorSummary>
        <div className="flex justify-end"><Button onClick={() => void handleSave()} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button></div>
      </div>
    </div>
  )
}
