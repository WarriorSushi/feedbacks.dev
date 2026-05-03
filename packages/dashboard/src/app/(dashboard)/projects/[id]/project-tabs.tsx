'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import { readStoredProjectApiKey, rememberProjectApiKey } from '@/lib/project-api-keys'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Check, Loader2, Trash2, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { BoardSettingsTab } from './board-settings'
import { ApiDocs } from './api-docs'
import { toast } from '@/hooks/use-toast'
import { Suspense } from 'react'
import { InstallTab } from './install-tab'
import { CustomizeTab } from './customize-tab'
import { IntegrationsTab } from './integrations-tab'

interface ProjectTabsProps {
  project: Project
}

type TabId = 'install' | 'customize' | 'integrations' | 'board' | 'api' | 'settings'

const tabs: { id: TabId; label: string }[] = [
  { id: 'customize', label: 'Customize' },
  { id: 'install', label: 'Install' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'board', label: 'Public Board' },
  { id: 'api', label: 'API' },
  { id: 'settings', label: 'Settings' },
]

export function ProjectTabs({ project }: ProjectTabsProps) {
  return (
    <Suspense>
      <ProjectTabsInner project={project} />
    </Suspense>
  )
}

function ProjectTabsInner({ project }: ProjectTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isInteractive, setIsInteractive] = React.useState(false)
  const [apiKey, setApiKey] = React.useState<string | null>(project.api_key)
  const [rotatingApiKey, setRotatingApiKey] = React.useState(false)
  const tabParam = searchParams.get('tab') as TabId | null
  const created = searchParams.get('created') === '1'
  const activeTab = tabs.some((t) => t.id === tabParam) ? tabParam! : 'customize'
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

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`)
  }

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
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>
        {created && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Start by choosing how the widget should appear. Save the look, then copy the generated install snippet.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ApiKeyBadge
            apiKey={apiKey}
            lastFour={apiKeyLastFour}
            rotating={rotatingApiKey}
            onRotate={handleRotateApiKey}
          />
          <a href={`/api/projects/${project.id}/feedback.csv`} download>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs font-medium">
              <Download className="h-3 w-3" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'install' && (
        <InstallTab
          project={project}
          projectKey={apiKey}
          apiKeyLastFour={apiKeyLastFour}
          rotatingApiKey={rotatingApiKey}
          onRotateApiKey={handleRotateApiKey}
          created={created}
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
      {activeTab === 'integrations' && <IntegrationsTab project={project} />}
      {activeTab === 'board' && <BoardSettingsTab project={project} />}
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

function ApiKeyBadge({
  apiKey,
  lastFour,
  rotating,
  onRotate,
}: {
  apiKey: string | null
  lastFour: string | null
  rotating: boolean
  onRotate: () => Promise<void>
}) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {apiKey ? (
        <button onClick={copy} className="flex items-center gap-1.5" aria-label="Copy API key">
          <Badge variant="outline" className="font-mono text-xs">
            Key visible · ••••{lastFour || apiKey.slice(-4)}
          </Badge>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      ) : (
        <Badge variant="outline" className="font-mono text-xs">
          Key hidden{lastFour ? ` · ••••${lastFour}` : ''}
        </Badge>
      )}
      <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs font-medium" onClick={() => void onRotate()} disabled={rotating}>
        {rotating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Rotate API key
      </Button>
    </div>
  )
}

function SettingsTab({ project }: { project: Project }) {
  const supabase = React.useMemo(() => createClient(), [])
  const router = useRouter()
  const [name, setName] = React.useState(project.name)
  const [domain, setDomain] = React.useState(project.domain || '')
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleteInput, setDeleteInput] = React.useState('')

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        domain: domain.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Project settings saved' })
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) {
      toast({ title: 'Failed to delete project', description: error.message, variant: 'destructive' })
      setDeleting(false)
      return
    }
    router.push('/projects')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Settings</CardTitle>
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
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
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
