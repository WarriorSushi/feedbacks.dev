'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readStoredProjectApiKey, rememberProjectApiKey } from '@/lib/project-api-keys'
import type { BillingSummary, Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { parseAllowedOrigins } from '@/lib/origin-allowlist'
import { Loader2, Trash2 } from 'lucide-react'
import { BoardSettingsTab } from './board-settings'
import { ApiDocs } from './api-docs'
import { toast } from '@/hooks/use-toast'
import { Suspense } from 'react'
import { InstallTab } from './install-tab'
import { CustomizeTab } from './customize-tab'
import { IntegrationsTab } from './integrations-tab'
import { SetupProgress } from './project-flow-nav'
import { ProductUpdatesTab } from '@/components/product-updates/ProductUpdatesTab'
import { ProjectHome } from './project-home'
import { PageHeader } from '@/components/ui/workspace-shell'

interface ProjectTabsProps {
  project: Project
  billingSummary: BillingSummary | null
  initialTab?: TabId
  updatesView?: 'overview' | 'composer' | 'settings'
  updateId?: string
}

export type ProjectTab = 'home' | 'install' | 'customize' | 'integrations' | 'board' | 'updates' | 'api' | 'settings'
type TabId = ProjectTab

const tabs: TabId[] = ['home', 'install', 'customize', 'integrations', 'board', 'updates', 'api', 'settings']

export function ProjectTabs({ project, billingSummary, initialTab, updatesView, updateId }: ProjectTabsProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Loading project workspace...
        </div>
      }
    >
      <ProjectTabsInner project={project} billingSummary={billingSummary} initialTab={initialTab} updatesView={updatesView} updateId={updateId} />
    </Suspense>
  )
}

function ProjectTabsInner({ project, billingSummary, initialTab, updatesView, updateId }: ProjectTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isInteractive, setIsInteractive] = React.useState(false)
  const [apiKey, setApiKey] = React.useState<string | null>(project.api_key)
  const [rotatingApiKey, setRotatingApiKey] = React.useState(false)
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab = initialTab || (tabs.includes(tabParam as TabId) ? tabParam! : 'home')
  const apiKeyLastFour = React.useMemo(
    () => apiKey?.slice(-4) || project.api_key_last_four || null,
    [apiKey, project.api_key_last_four],
  )

  React.useEffect(() => {
    setIsInteractive(true)
  }, [])

  React.useEffect(() => {
    if (project.api_key) {
      rememberProjectApiKey(project.id, project.api_key)
      setApiKey(project.api_key)
      return
    }

    const storedKey = readStoredProjectApiKey(project.id)
    if (storedKey) {
      setApiKey(storedKey)
    }
  }, [project.api_key, project.id])

  const handleRotateApiKey = async () => {
    setRotatingApiKey(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/rotate-key`, {
        method: 'POST',
      })
      const payload = await response.json().catch(() => ({ error: 'Failed to rotate API key' }))
      if (!response.ok || !payload.api_key) {
        throw new Error(payload.error || 'Failed to rotate API key')
      }

      rememberProjectApiKey(project.id, payload.api_key)
      setApiKey(payload.api_key)
      toast({
        title: 'New API key generated',
        description: 'This key is only visible in this browser session. Copy it into your app or agent config now.',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Failed to rotate API key',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRotatingApiKey(false)
    }
  }

  return (
    <div className="space-y-6" data-project-tabs-ready={isInteractive ? 'true' : 'false'}>
      {activeTab === 'install' && <SetupProgress projectId={project.id} activeStep="install" />}

      {activeTab === 'home' && <ProjectHome project={project} />}

      {activeTab === 'install' && (
        <InstallTab
          project={project}
          projectKey={apiKey}
          apiKeyLastFour={apiKeyLastFour}
          rotatingApiKey={rotatingApiKey}
          onRotateApiKey={handleRotateApiKey}
        />
      )}
      {activeTab === 'customize' && (
        <CustomizeTab
          project={project}
          projectKey={apiKey}
          apiKeyLastFour={apiKeyLastFour}
          rotatingApiKey={rotatingApiKey}
          onRotateApiKey={handleRotateApiKey}
        />
      )}
      {activeTab === 'integrations' && <IntegrationsTab project={project} initialBillingSummary={billingSummary} />}
      {activeTab === 'board' && <BoardSettingsTab project={project} />}
      {activeTab === 'updates' && <ProductUpdatesTab projectId={project.id} projectKey={apiKey} view={updatesView} updateId={updateId} />}
      {activeTab === 'api' && (
        <ApiDocs
          project={project}
          projectKey={apiKey}
          apiKeyLastFour={apiKeyLastFour}
          rotatingApiKey={rotatingApiKey}
          onRotateApiKey={handleRotateApiKey}
        />
      )}
      {activeTab === 'settings' && <SettingsTab project={project} />}
    </div>
  )
}

function SettingsTab({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = React.useState(project.name)
  const [domain, setDomain] = React.useState(project.domain || '')
  const [restrictOrigins, setRestrictOrigins] = React.useState(
    Boolean(project.settings?.widget_origin_restriction?.enabled),
  )
  const [allowedOriginsText, setAllowedOriginsText] = React.useState(
    (project.settings?.widget_origin_restriction?.origins || []).join('\n'),
  )
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleteInput, setDeleteInput] = React.useState('')

  const handleSave = async () => {
    setSaving(true)
    const origins = parseAllowedOrigins(allowedOriginsText)

    if (restrictOrigins && origins.length === 0) {
      setSaving(false)
      toast({
        title: 'Add at least one allowed site',
        description: 'Use full URLs like https://example.com, one per line.',
        variant: 'destructive',
      })
      return
    }

    const response = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        domain: domain.trim() || null,
        settings: {
          ...project.settings,
          widget_origin_restriction: {
            enabled: restrictOrigins,
            origins,
          },
        },
      }),
    })
    const payload = await response.json().catch(() => null)
    setSaving(false)
    if (!response.ok) {
      toast({
        title: 'Failed to save settings',
        description: payload?.error || 'Please try again.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Project settings saved' })
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast({
        title: 'Failed to delete project',
        description: payload?.error || 'Please try again.',
        variant: 'destructive',
      })
      setDeleting(false)
      return
    }
    window.dispatchEvent(
      new CustomEvent('feedbacks:project-deleted', { detail: { projectId: project.id } }),
    )
    router.replace('/projects')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={project.name} title="Project settings" description="Manage identity, allowed origins, and project lifecycle." />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-domain">Domain</Label>
            <Input
              id="project-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="myapp.com"
            />
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <input
                id="restrict-widget-origins"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
                checked={restrictOrigins}
                onChange={(event) => setRestrictOrigins(event.target.checked)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="restrict-widget-origins" className="text-sm font-semibold">
                  Restrict widget submissions to my sites
                </Label>
                <p className="text-sm text-muted-foreground">
                  Leave this off while installing. Turn it on after the widget works to block submissions from other websites using your project key.
                </p>
                <Textarea
                  value={allowedOriginsText}
                  onChange={(event) => setAllowedOriginsText(event.target.value)}
                  placeholder={`https://example.com\nhttps://app.example.com`}
                  rows={3}
                  disabled={!restrictOrigins}
                  aria-label="Allowed widget origins"
                />
                <p className="text-xs text-muted-foreground">
                  One origin per line. Use only scheme and domain, like https://example.com. Do not include paths.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Delete project</CardTitle>
          <CardDescription>
            Permanently delete this project and all its feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmDelete ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Project
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                This cannot be undone. Type <strong>{project.name}</strong> to confirm.
              </p>
              <Input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={project.name}
                aria-label="Type project name to confirm deletion"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting || deleteInput !== project.name}
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Delete
                </Button>
                <Button variant="outline" onClick={() => { setConfirmDelete(false); setDeleteInput('') }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
