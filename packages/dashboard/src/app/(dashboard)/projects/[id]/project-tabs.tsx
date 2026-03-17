'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Project, WidgetConfig } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CodeSnippet } from '@/components/code-snippet'
import { ArrowLeft, Copy, Check, Loader2, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import { BoardSettingsTab } from './board-settings'
import { ApiDocs } from './api-docs'
import { toast } from '@/hooks/use-toast'
import { Suspense } from 'react'

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
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab = tabs.some((t) => t.id === tabParam) ? tabParam! : 'install'

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Projects
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/projects/${project.id}/feedback.csv`} download>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </a>
          <ApiKeyBadge apiKey={project.api_key} />
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

      {activeTab === 'install' && <InstallTab project={project} />}
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

function InstallTab({ project }: { project: Project }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.feedbacks.dev'
  const htmlSnippet = `<script
  src="${origin}/widget/latest.js"
  data-project="${project.api_key}"
  defer
></script>`

  const reactSnippet = `import { FeedbackWidget } from '@feedbacks/widget'

export default function App() {
  return (
    <>
      <FeedbackWidget projectKey="${project.api_key}" />
      {/* your app */}
    </>
  )
}`

  const vueSnippet = `<script setup>
import { FeedbackWidget } from '@feedbacks/widget'
</script>

<template>
  <FeedbackWidget project-key="${project.api_key}" />
</template>`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Installation</CardTitle>
          <CardDescription>
            Add the feedback widget to your site in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeSnippet
            tabs={[
              { label: 'HTML', code: htmlSnippet, language: 'html' },
              { label: 'React', code: reactSnippet, language: 'tsx' },
              { label: 'Vue', code: vueSnippet, language: 'vue' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Widget Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-md border bg-muted/30 p-12">
            <div className="w-80 rounded-lg border bg-card p-4 shadow-lg">
              <h3 className="mb-1 font-semibold">Send Feedback</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                We&apos;d love to hear from you
              </p>
              <div className="mb-3 h-20 rounded border bg-muted" />
              <div className="flex justify-end">
                <div className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                  Submit
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomizeTab({ project }: { project: Project }) {
  const supabase = React.useMemo(() => createClient(), [])
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const existing = project.settings?.widget_config || {}
  const [config, setConfig] = React.useState<WidgetConfig>({
    primaryColor: existing.primaryColor || '#6366f1',
    buttonText: existing.buttonText || 'Feedback',
    position: existing.position || 'bottom-right',
    enableRating: existing.enableRating ?? true,
    enableType: existing.enableType ?? true,
    enableScreenshot: existing.enableScreenshot ?? false,
    requireEmail: existing.requireEmail ?? false,
    formTitle: existing.formTitle || 'Send Feedback',
    messagePlaceholder: existing.messagePlaceholder || "What's on your mind?",
  })

  const updateConfig = (key: keyof WidgetConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({
        settings: { ...project.settings, widget_config: config },
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Widget settings saved' })
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Widget Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primary-color"
                value={config.primaryColor || '#6366f1'}
                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={config.primaryColor || ''}
                onChange={(e) => updateConfig('primaryColor', e.target.value)}
                aria-label="Primary color hex value"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="button-text">Button Text</Label>
            <Input
              id="button-text"
              value={config.buttonText || ''}
              onChange={(e) => updateConfig('buttonText', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-select">Position</Label>
            <select
              id="position-select"
              aria-label="Widget position"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={config.position || 'bottom-right'}
              onChange={(e) => updateConfig('position', e.target.value)}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-title">Form Title</Label>
            <Input
              id="form-title"
              value={config.formTitle || ''}
              onChange={(e) => updateConfig('formTitle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-placeholder">Message Placeholder</Label>
            <Input
              id="msg-placeholder"
              value={config.messagePlaceholder || ''}
              onChange={(e) => updateConfig('messagePlaceholder', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Optional Fields</Label>
          {(
            [
              ['enableRating', 'Rating Stars'],
              ['enableType', 'Feedback Type Picker'],
              ['enableScreenshot', 'Screenshot Capture'],
              ['requireEmail', 'Require Email'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!config[key]}
                onChange={(e) => updateConfig(key, e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              {label}
            </label>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}

function IntegrationsTab({ project }: { project: Project }) {
  const supabase = React.useMemo(() => createClient(), [])
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)

  const [slackUrl, setSlackUrl] = React.useState(
    project.webhooks?.slack?.url || ''
  )
  const [discordUrl, setDiscordUrl] = React.useState(
    project.webhooks?.discord?.url || ''
  )
  const [webhookUrl, setWebhookUrl] = React.useState(
    project.webhooks?.generic?.url || ''
  )

  const handleSave = async () => {
    setSaving(true)
    const webhooks = {
      ...project.webhooks,
      slack: slackUrl ? { url: slackUrl, enabled: true } : undefined,
      discord: discordUrl ? { url: discordUrl, enabled: true } : undefined,
      generic: webhookUrl ? { url: webhookUrl, enabled: true } : undefined,
    }
    const { error } = await supabase
      .from('projects')
      .update({ webhooks, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Failed to save integrations', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Integrations saved' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {[
        { label: 'Slack Webhook URL', value: slackUrl, setter: setSlackUrl, placeholder: 'https://hooks.slack.com/services/...' },
        { label: 'Discord Webhook URL', value: discordUrl, setter: setDiscordUrl, placeholder: 'https://discord.com/api/webhooks/...' },
        { label: 'Generic Webhook URL', value: webhookUrl, setter: setWebhookUrl, placeholder: 'https://your-server.com/webhook' },
      ].map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-sm">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder={item.placeholder}
              value={item.value}
              onChange={(e) => item.setter(e.target.value)}
            />
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Integrations
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
