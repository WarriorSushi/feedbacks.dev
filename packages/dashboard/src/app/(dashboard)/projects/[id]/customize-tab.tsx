'use client'

import * as React from 'react'
import { buildRuntimeWidgetConfig, sanitizeSavedWidgetConfig } from '@feedbacks/shared'
import { useRouter } from 'next/navigation'
import type { Project, WidgetConfig } from '@/lib/types'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WidgetPreviewSurface } from './widget-preview-surface'

interface CustomizeTabProps {
  project: Project
}

function buildEditableWidgetConfig(existing: WidgetConfig = {}): WidgetConfig {
  const sanitized = sanitizeSavedWidgetConfig(existing)
  return {
    ...sanitized,
    embedMode: sanitized.embedMode || 'modal',
    primaryColor: sanitized.primaryColor || '#6366f1',
    buttonText: sanitized.buttonText || 'Feedback',
    position: sanitized.position || 'bottom-right',
    enableRating: sanitized.enableRating ?? true,
    enableType: sanitized.enableType ?? true,
    enableScreenshot: sanitized.enableScreenshot ?? false,
    requireEmail: sanitized.requireEmail ?? false,
    formTitle: sanitized.formTitle || 'Send Feedback',
    messagePlaceholder: sanitized.messagePlaceholder || "What's on your mind?",
  }
}

export function CustomizeTab({ project }: CustomizeTabProps) {
  const router = useRouter()
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const [saving, setSaving] = React.useState(false)
  const [draftRestored, setDraftRestored] = React.useState(false)
  const [previewStatus, setPreviewStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const storageKey = React.useMemo(() => `feedbacks-widget-draft:${project.id}`, [project.id])
  const savedConfig = React.useMemo(
    () => buildEditableWidgetConfig(project.settings?.widget_config || {}),
    [project.settings?.widget_config],
  )
  const [config, setConfig] = React.useState<WidgetConfig>(savedConfig)

  const fingerprintConfig = React.useCallback(
    (nextConfig: WidgetConfig) =>
      JSON.stringify(
        buildRuntimeWidgetConfig(project.api_key, nextConfig, {
          appOrigin,
        }),
      ),
    [appOrigin, project.api_key],
  )

  React.useEffect(() => {
    setConfig(savedConfig)
    setDraftRestored(false)

    if (typeof window === 'undefined') return

    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return

    try {
      const parsed = buildEditableWidgetConfig(JSON.parse(raw) as WidgetConfig)
      if (fingerprintConfig(parsed) !== fingerprintConfig(savedConfig)) {
        setConfig(parsed)
        setDraftRestored(true)
      } else {
        window.sessionStorage.removeItem(storageKey)
      }
    } catch {
      window.sessionStorage.removeItem(storageKey)
    }
  }, [fingerprintConfig, savedConfig, storageKey])

  const savedFingerprint = React.useMemo(
    () => fingerprintConfig(savedConfig),
    [fingerprintConfig, savedConfig],
  )
  const draftFingerprint = React.useMemo(
    () => fingerprintConfig(config),
    [config, fingerprintConfig],
  )
  const hasUnsavedChanges = savedFingerprint !== draftFingerprint
  const runtimePreviewConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(project.api_key, config, { appOrigin }),
    [appOrigin, config, project.api_key],
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    if (hasUnsavedChanges) {
      window.sessionStorage.setItem(storageKey, JSON.stringify(config))
    } else {
      window.sessionStorage.removeItem(storageKey)
    }
  }, [config, hasUnsavedChanges, storageKey])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const updateConfig = (key: keyof WidgetConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setConfig(savedConfig)
    setDraftRestored(false)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { ...project.settings, widget_config: config },
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to save widget settings' }))
        throw new Error(data.error || 'Failed to save widget settings')
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey)
      }
      setDraftRestored(false)
      toast({ title: 'Widget settings saved' })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Failed to save widget settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const modeLabel =
    runtimePreviewConfig.embedMode === 'inline'
      ? 'Inline'
      : runtimePreviewConfig.embedMode === 'trigger'
        ? 'Trigger'
        : 'Modal'

  return (
    <div className="space-y-6">
      <Card className={hasUnsavedChanges ? 'border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/10' : ''}>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>
                {hasUnsavedChanges ? 'Unsaved draft' : 'Saved config'}
              </Badge>
              <Badge variant="outline">Live preview</Badge>
              <Badge variant="outline">{modeLabel} mode</Badge>
            </div>
            <div>
              <CardTitle className="text-lg">Customize widget</CardTitle>
              <CardDescription className="mt-1">
                Preview updates as you edit. Install snippets and the hosted verify page continue to use the last saved config until you save changes here.
              </CardDescription>
            </div>
            {draftRestored && hasUnsavedChanges && (
              <p className="text-sm text-muted-foreground">
                A local unsaved draft was restored for this project.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving || !hasUnsavedChanges}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to saved
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Widget settings</CardTitle>
            <CardDescription>
              Keep install simple first. This tab is for secondary tuning after the snippet already works.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="embed-mode">Embed Mode</Label>
                <select
                  id="embed-mode"
                  aria-label="Widget embed mode"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={config.embedMode || 'modal'}
                  onChange={(e) => updateConfig('embedMode', e.target.value)}
                >
                  <option value="modal">Modal launcher</option>
                  <option value="inline">Inline embed</option>
                  <option value="trigger">Custom trigger button</option>
                </select>
              </div>
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
                  disabled={config.embedMode !== 'modal'}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
                {config.embedMode !== 'modal' && (
                  <p className="text-xs text-muted-foreground">
                    Launcher position only applies to modal mode.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  value={config.formTitle || ''}
                  onChange={(e) => updateConfig('formTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
              <Label className="text-sm font-medium">Optional fields</Label>
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
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Preview current edits</CardTitle>
            <CardDescription>
              This preview reflects your draft immediately. Saving publishes these settings to install snippets and the verification page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>
                {hasUnsavedChanges ? 'Previewing unsaved changes' : 'Preview matches saved config'}
              </Badge>
              <Badge variant="outline">
                {previewStatus === 'loading' ? 'Loading runtime' : previewStatus === 'ready' ? 'Runtime ready' : 'Preview error'}
              </Badge>
            </div>

            <WidgetPreviewSurface
              appOrigin={appOrigin}
              projectKey={project.api_key}
              config={config}
              onStatusChange={(status, error) => {
                setPreviewStatus(status)
                setPreviewError(error || null)
              }}
            />

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Saved mode: <span className="font-medium text-foreground">{modeLabel}</span>
              </p>
              {previewStatus === 'ready' && runtimePreviewConfig.embedMode === 'modal' && (
                <p>Look near the lower-right corner for the modal launcher.</p>
              )}
              {previewStatus === 'error' && previewError && (
                <p className="text-destructive">{previewError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
