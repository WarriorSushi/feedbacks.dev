'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Check, Loader2, Trash2, Download } from 'lucide-react'
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
  { id: 'install', label: 'Install' },
  { id: 'customize', label: 'Customize' },
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
  const tabParam = searchParams.get('tab') as TabId | null
  const created = searchParams.get('created') === '1'
  const activeTab = tabs.some((t) => t.id === tabParam) ? tabParam! : 'install'

  React.useEffect(() => {
    setIsInteractive(true)
  }, [])

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`)
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ApiKeyBadge apiKey={project.api_key} />
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

      {activeTab === 'install' && <InstallTab project={project} created={created} />}
      {activeTab === 'customize' && <CustomizeTab project={project} />}
      {activeTab === 'integrations' && <IntegrationsTab project={project} />}
      {activeTab === 'board' && <BoardSettingsTab project={project} />}
      {activeTab === 'api' && <ApiDocs project={project} />}
      {activeTab === 'settings' && <SettingsTab project={project} />}
    </div>
  )
}

function ApiKeyBadge({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5" aria-label="Copy API key">
      <Badge variant="outline" className="font-mono text-xs">
        {apiKey.slice(0, 8)}••••
      </Badge>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
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
