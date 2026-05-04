'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { BoardReport, Project } from '@/lib/types'
import type { BoardAnnouncement, BoardBranding } from '@/lib/public-board'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Copy, ExternalLink, Globe2, Loader2, Lock, Rocket, Settings2 } from 'lucide-react'
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
  const canOpenBoard = settings.enabled && !isPrivate
  const launchSteps = [
    { label: 'URL ready', done: Boolean(settings.slug) },
    { label: 'Public access enabled', done: canOpenBoard },
    { label: 'Visitors can post', done: settings.allow_submissions },
  ]
  const completedSteps = launchSteps.filter((step) => step.done).length

  const updateSettings = (patch: Partial<BoardSettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
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

    toast({ title: successTitle })
    setSaving(false)
    router.refresh()
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
        visibility: isPrivate ? 'public' : settings.branding.visibility || 'public',
      },
    }
    setSettings(nextSettings)
    await persistSettings(nextSettings, 'Public board enabled')
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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={canOpenBoard ? 'secondary' : 'outline'}>
                  {canOpenBoard ? 'Live public page' : settings.enabled ? 'Private draft' : 'Not published'}
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
              <CardTitle className="mt-3 text-xl">Public board</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Publish a clean customer-facing page for feedback, votes, public replies, and product updates.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {!canOpenBoard && (
                <Button onClick={() => void handleEnableAndSave()} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                  Enable and save
                </Button>
              )}
              <Button variant="outline" onClick={copyUrl} disabled={!settings.slug}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy link
              </Button>
              {canOpenBoard ? (
                <Button variant="outline" asChild>
                  <a href={boardUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open public board
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open public board
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
              {canOpenBoard ? <Globe2 className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {canOpenBoard ? 'Share this board with customers' : 'Finish setup, then publish'}
              </p>
              <p className="mt-1 truncate font-mono text-sm text-muted-foreground">{boardUrl}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Followers', value: stats.followerCount, description: 'People following the board.' },
                { label: 'Watched posts', value: stats.watchCount, description: 'Requests watched for updates.' },
                { label: 'Open reports', value: stats.openReportCount, description: 'Reports awaiting review.' },
              ].map(({ label, value, description }) => (
                <div key={label} className="rounded-xl border bg-background px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Launch checklist</p>
                <span className="text-xs font-medium text-muted-foreground">
                  {completedSteps}/{launchSteps.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {launchSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border',
                        step.done
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {step.done ? <Check className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                    </span>
                    <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Board Settings
      </Button>
    </div>
  )
}
