'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Loader2, ExternalLink } from 'lucide-react'

interface BoardSettingsProps {
  project: Project
}

interface BoardSettings {
  id?: string
  enabled: boolean
  slug: string
  title: string
  description: string
  show_types: string[]
  allow_submissions: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function BoardSettingsTab({ project }: BoardSettingsProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [settings, setSettings] = React.useState<BoardSettings>({
    enabled: false,
    slug: slugify(project.name),
    title: `${project.name} — Feature Board`,
    description: 'Vote on features and help us build what matters to you.',
    show_types: ['idea', 'bug'],
    allow_submissions: true,
  })

  // Load existing settings
  React.useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('public_board_settings')
        .select('*')
        .eq('project_id', project.id)
        .single()

      if (data) {
        setSettings({
          id: data.id,
          enabled: data.enabled,
          slug: data.slug,
          title: data.title || '',
          description: data.description || '',
          show_types: data.show_types || ['idea', 'bug'],
          allow_submissions: data.allow_submissions,
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase, project.id])

  const handleSave = async () => {
    setSaving(true)

    if (settings.id) {
      await supabase
        .from('public_board_settings')
        .update({
          enabled: settings.enabled,
          slug: settings.slug,
          title: settings.title,
          description: settings.description,
          show_types: settings.show_types,
          allow_submissions: settings.allow_submissions,
        })
        .eq('id', settings.id)
    } else {
      const { data } = await supabase
        .from('public_board_settings')
        .insert({
          project_id: project.id,
          enabled: settings.enabled,
          slug: settings.slug,
          title: settings.title,
          description: settings.description,
          show_types: settings.show_types,
          allow_submissions: settings.allow_submissions,
        })
        .select('id')
        .single()

      if (data) {
        setSettings((prev) => ({ ...prev, id: data.id }))
      }
    }

    setSaving(false)
    router.refresh()
  }

  const boardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${settings.slug}`
    : `/p/${settings.slug}`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(boardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleType = (type: string) => {
    setSettings((prev) => ({
      ...prev,
      show_types: prev.show_types.includes(type)
        ? prev.show_types.filter((t) => t !== type)
        : [...prev.show_types, type],
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Public Feature Board</CardTitle>
          <CardDescription>
            Let your users vote on features and submit feedback publicly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Enable toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((p) => ({ ...p, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-indigo-600 transition-colors dark:bg-gray-700" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium">
              {settings.enabled ? 'Board is live' : 'Board is disabled'}
            </span>
          </label>

          <Separator />

          {/* Slug */}
          <div className="space-y-2">
            <Label>Board URL slug</Label>
            <div className="flex gap-2">
              <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                /p/
              </div>
              <Input
                value={settings.slug}
                onChange={(e) => setSettings((p) => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="my-app"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Board Title</Label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))}
              placeholder="My App — Feature Board"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={settings.description}
              onChange={(e) => setSettings((p) => ({ ...p, description: e.target.value }))}
              placeholder="Help us build what matters to you."
            />
          </div>

          <Separator />

          {/* Types to show */}
          <div className="space-y-2">
            <Label>Feedback types to show</Label>
            <div className="flex flex-wrap gap-2">
              {(['idea', 'bug', 'praise', 'question'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.show_types.includes(type)}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="capitalize">{type === 'idea' ? 'Feature Requests' : type === 'bug' ? 'Bugs' : type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allow submissions */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allow_submissions}
              onChange={(e) => setSettings((p) => ({ ...p, allow_submissions: e.target.checked }))}
              className="h-4 w-4 rounded border"
            />
            Allow visitors to submit feedback
          </label>

          <Separator />

          {/* Public URL */}
          {settings.enabled && settings.slug && (
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

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Board Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
