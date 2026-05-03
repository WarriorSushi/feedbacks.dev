'use client'

import * as React from 'react'
import { buildRuntimeWidgetConfig, buildWidgetEditorConfig, getWidgetModeLabel } from '@feedbacks/shared'
import { useRouter } from 'next/navigation'
import type { Project, WidgetConfig } from '@/lib/types'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, MousePointerClick, PanelTop, RotateCcw, Send } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WidgetFormPreview } from './widget-form-preview'

interface CustomizeTabProps {
  project: Project
  projectKey: string | null
  apiKeyLastFour: string | null
  rotatingApiKey: boolean
  onRotateApiKey: () => Promise<void>
}

const TRACKED_WIDGET_FIELDS: Array<[keyof WidgetConfig, string]> = [
  ['embedMode', 'Embed mode'],
  ['primaryColor', 'Primary color'],
  ['buttonText', 'Button text'],
  ['position', 'Launcher position'],
  ['formTitle', 'Form title'],
  ['messagePlaceholder', 'Message placeholder'],
  ['enableRating', 'Rating stars'],
  ['enableType', 'Feedback type picker'],
  ['enableScreenshot', 'Screenshot capture'],
  ['requireEmail', 'Require email'],
]

export function CustomizeTab({
  project,
  projectKey,
  apiKeyLastFour,
  rotatingApiKey,
  onRotateApiKey,
}: CustomizeTabProps) {
  const router = useRouter()
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const previewProjectKey = projectKey || 'fb_preview_only'
  const [saving, setSaving] = React.useState(false)
  const [draftRestored, setDraftRestored] = React.useState(false)
  const [draftHydrated, setDraftHydrated] = React.useState(false)
  const storageKey = React.useMemo(() => `feedbacks-widget-draft:${project.id}`, [project.id])
  const serverSavedConfig = React.useMemo(
    () => buildWidgetEditorConfig(previewProjectKey, project.settings?.widget_config || {}, { appOrigin }),
    [appOrigin, previewProjectKey, project.settings?.widget_config],
  )
  const [savedConfig, setSavedConfig] = React.useState<WidgetConfig>(serverSavedConfig)
  const [config, setConfig] = React.useState<WidgetConfig>(serverSavedConfig)

  React.useEffect(() => {
    setSavedConfig(serverSavedConfig)
  }, [serverSavedConfig])

  const fingerprintConfig = React.useCallback(
    (nextConfig: WidgetConfig) =>
      JSON.stringify(
        buildRuntimeWidgetConfig(previewProjectKey, nextConfig, {
          appOrigin,
        }),
      ),
    [appOrigin, previewProjectKey],
  )

  React.useEffect(() => {
    setDraftHydrated(false)
    setConfig(savedConfig)
    setDraftRestored(false)

    if (typeof window === 'undefined') {
      setDraftHydrated(true)
      return
    }

    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) {
      setDraftHydrated(true)
      return
    }

    try {
      const parsed = buildWidgetEditorConfig(previewProjectKey, JSON.parse(raw) as WidgetConfig, { appOrigin })
      if (fingerprintConfig(parsed) !== fingerprintConfig(savedConfig)) {
        setConfig(parsed)
        setDraftRestored(true)
      } else {
        window.sessionStorage.removeItem(storageKey)
      }
    } catch {
      window.sessionStorage.removeItem(storageKey)
    } finally {
      setDraftHydrated(true)
    }
  }, [appOrigin, fingerprintConfig, previewProjectKey, savedConfig, storageKey])

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
    () => buildRuntimeWidgetConfig(previewProjectKey, config, { appOrigin }),
    [appOrigin, config, previewProjectKey],
  )
  const savedRuntimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(previewProjectKey, savedConfig, { appOrigin }),
    [appOrigin, previewProjectKey, savedConfig],
  )
  const savedModeLabel = React.useMemo(
    () => getWidgetModeLabel(savedRuntimeConfig),
    [savedRuntimeConfig],
  )
  const draftModeLabel = React.useMemo(
    () => getWidgetModeLabel(runtimePreviewConfig),
    [runtimePreviewConfig],
  )
  const changedFields = React.useMemo(
    () =>
      TRACKED_WIDGET_FIELDS
        .filter(([key]) => savedConfig[key] !== config[key])
        .map(([, label]) => label),
    [config, savedConfig],
  )
  const changedFieldsSummary = changedFields.length === 0
    ? 'No local draft changes.'
    : changedFields.length <= 4
      ? changedFields.join(', ')
      : `${changedFields.slice(0, 4).join(', ')} +${changedFields.length - 4} more`

  React.useEffect(() => {
    if (typeof window === 'undefined' || !draftHydrated) return

    if (hasUnsavedChanges) {
      window.sessionStorage.setItem(storageKey, JSON.stringify(config))
    } else {
      window.sessionStorage.removeItem(storageKey)
    }
  }, [config, draftHydrated, hasUnsavedChanges, storageKey])

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

      const payload = await response.json()
      const nextSavedConfig = buildWidgetEditorConfig(previewProjectKey, payload.settings?.widget_config || {}, { appOrigin })
      setSavedConfig(nextSavedConfig)
      setConfig(nextSavedConfig)

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

  const embedMode = config.embedMode || 'modal'
  const isFloatingButton = embedMode === 'modal'
  const isInlineForm = embedMode === 'inline'

  return (
    <div className="space-y-6">
      <Card className={hasUnsavedChanges ? 'border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/10' : ''}>
        <CardHeader className="space-y-4 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>
                  {hasUnsavedChanges ? 'Unsaved draft' : 'Saved'}
                </Badge>
                <Badge variant="outline">{draftModeLabel}</Badge>
              </div>
              <div>
                <CardTitle className="text-lg">Make the feedback form fit your product</CardTitle>
                <CardDescription className="mt-1">
                  {hasUnsavedChanges
                    ? 'Preview your draft, save it, then install that exact version.'
                    : 'Saved version used by install snippets and hosted verification.'}
                </CardDescription>
              </div>
              {draftRestored && hasUnsavedChanges && (
                <p className="text-sm text-muted-foreground">
                  A local draft was restored for this project. Save it to use it outside this browser.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button variant="outline" onClick={handleReset} disabled={saving || !hasUnsavedChanges}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Discard draft
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            <span>
              Install uses <span className="font-medium text-foreground">{savedModeLabel}</span>
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>
              {hasUnsavedChanges ? (
                <>
                  Draft changes: <span className="font-medium text-foreground">{changedFieldsSummary}</span>
                </>
              ) : (
                'Preview matches saved install'
              )}
            </span>
          </div>
        </CardHeader>
      </Card>

      {!projectKey && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Key hidden{apiKeyLastFour ? ` · ••••${apiKeyLastFour}` : ''}</Badge>
              <span className="font-medium text-foreground">Preview still works.</span>
            </div>
            <p className="text-muted-foreground">
              Generate a fresh key later when you are ready to install or verify live.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => void onRotateApiKey()}
            disabled={rotatingApiKey}
          >
            {rotatingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate key
          </Button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Widget settings</CardTitle>
            <CardDescription>
              Choose where feedback appears, then tune the form details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Placement</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick one install style. The install tab will generate the matching code.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    mode: 'modal',
                    title: 'Floating button',
                    body: 'Add a launcher in the corner of your app.',
                    Icon: Send,
                  },
                  {
                    mode: 'trigger',
                    title: 'Your own button',
                    body: 'Open the form from an existing button or link.',
                    Icon: MousePointerClick,
                  },
                  {
                    mode: 'inline',
                    title: 'Form on a page',
                    body: 'Embed the full form inside page content.',
                    Icon: PanelTop,
                  },
                ].map(({ mode, title, body, Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateConfig('embedMode', mode)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      embedMode === mode
                        ? 'border-primary/40 bg-primary/10'
                        : 'hover:border-foreground/20 hover:bg-muted/30'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Appearance</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep this light: color, launcher label, and position.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary color</Label>
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

                {isFloatingButton && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="button-text">Button text</Label>
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
                        <option value="bottom-right">Bottom right</option>
                        <option value="bottom-left">Bottom left</option>
                        <option value="top-right">Top right</option>
                        <option value="top-left">Top left</option>
                      </select>
                    </div>
                  </>
                )}

                {!isFloatingButton && (
                  <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground sm:col-span-2">
                    {isInlineForm
                      ? 'Inline forms do not need a launcher label or corner position.'
                      : 'Your app controls the trigger button label and placement. feedbacks.dev controls the form that opens.'}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Form content</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Write the title and placeholder users see inside the feedback form.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form title</Label>
                  <Input
                    id="form-title"
                    value={config.formTitle || ''}
                    onChange={(e) => updateConfig('formTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="msg-placeholder">Message placeholder</Label>
                  <Input
                    id="msg-placeholder"
                    value={config.messagePlaceholder || ''}
                    onChange={(e) => updateConfig('messagePlaceholder', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Fields</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add only the inputs you need for useful feedback.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['enableRating', 'Rating stars'],
                  ['enableType', 'Feedback type picker'],
                  ['enableScreenshot', 'Screenshot capture'],
                  ['requireEmail', 'Require email'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm transition-colors hover:bg-muted/30"
                >
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
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Live form preview</CardTitle>
            <CardDescription>
              See the opened form, not just the button. Placement, color, copy, and optional fields update as you edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>
                {hasUnsavedChanges ? 'Previewing unsaved changes' : 'Preview matches saved config'}
              </Badge>
              <Badge variant="outline">{draftModeLabel}</Badge>
            </div>

            <WidgetFormPreview config={config} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
