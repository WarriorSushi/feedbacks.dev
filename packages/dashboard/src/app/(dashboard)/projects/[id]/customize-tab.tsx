'use client'

import * as React from 'react'
import { buildRuntimeWidgetConfig, buildWidgetEditorConfig, getDefaultWidgetTarget, getWidgetModeLabel, type EmbedMode } from '@feedbacks/shared'
import type { Project, WidgetConfig } from '@/lib/types'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, MousePointerClick, PanelTop, Send, ShieldCheck } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WidgetFormPreview } from './widget-form-preview'
import { PageHeader } from '@/components/ui/workspace-shell'
import { mutationVersionHeaders } from '@/lib/optimistic-concurrency'
import { FieldError, FormErrorSummary } from '@/components/ui/field-error'
import { readErrorMessage, readFieldErrors, type FieldErrors } from '@/lib/form-errors'
import { CopyButton } from '@/components/copy-button'

interface CustomizeTabProps {
  project: Project
  projectKey: string
}

const TRACKED_WIDGET_FIELDS: Array<[keyof WidgetConfig, string]> = [
  ['embedMode', 'Embed mode'],
  ['target', 'Placement target'],
  ['primaryColor', 'Primary color'],
  ['buttonText', 'Button text'],
  ['position', 'Launcher position'],
  ['formTitle', 'Form title'],
  ['messagePlaceholder', 'Message placeholder'],
  ['enableRating', 'Rating stars'],
  ['enableType', 'Feedback type picker'],
  ['enableScreenshot', 'Screenshot capture'],
  ['requireEmail', 'Require email'],
  ['requireCaptcha', 'Human verification'],
  ['captchaProvider', 'Captcha provider'],
]

const HEX_COLOR_RE = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i

function triggerMarkupForSelector(selector: string): string {
  const trimmed = selector.trim()
  const id = trimmed.match(/^#([a-zA-Z][\w:-]*)$/)?.[1]
  if (id) return `<button id="${id}" type="button">Send feedback</button>`
  const className = trimmed.match(/^\.([a-zA-Z][\w-]*)$/)?.[1]
  if (className) return `<button class="${className}" type="button">Send feedback</button>`
  const attribute = trimmed.match(/^\[([a-zA-Z][\w-]*)\]$/)?.[1]
  if (attribute) return `<button ${attribute} type="button">Send feedback</button>`
  return `<!-- Make an existing button match this selector: ${trimmed || '#feedback-button'} -->`
}

export function CustomizeTab({
  project,
  projectKey,
}: CustomizeTabProps) {
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const previewProjectKey = projectKey
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [draftRestored, setDraftRestored] = React.useState(false)
  const [draftHydrated, setDraftHydrated] = React.useState(false)
  const [conflictingProject, setConflictingProject] = React.useState<Project | null>(null)
  const storageKey = React.useMemo(() => `feedbacks-widget-draft:${project.id}`, [project.id])
  const serverSavedConfig = React.useMemo(
    () => buildWidgetEditorConfig(previewProjectKey, project.settings?.widget_config || {}, { appOrigin }),
    [appOrigin, previewProjectKey, project.settings?.widget_config],
  )
  const [savedConfig, setSavedConfig] = React.useState<WidgetConfig>(serverSavedConfig)
  const [config, setConfig] = React.useState<WidgetConfig>(serverSavedConfig)
  const [projectVersion, setProjectVersion] = React.useState(project.updated_at)

  React.useEffect(() => {
    setSavedConfig(serverSavedConfig)
  }, [serverSavedConfig])

  React.useEffect(() => {
    setProjectVersion(project.updated_at)
  }, [project.id, project.updated_at])

  const fingerprintConfig = React.useCallback(
    (nextConfig: WidgetConfig) => {
      const runtimeConfig = buildRuntimeWidgetConfig(previewProjectKey, nextConfig, {
        appOrigin,
      })
      return JSON.stringify(
        Object.fromEntries(
          Object.entries(runtimeConfig).filter(
            ([key]) => key !== 'feedbackEnabled' && key !== 'enableUpdates',
          ),
        ),
      )
    },
    [appOrigin, previewProjectKey],
  )

  const editorConfigFromProject = React.useCallback(
    (nextProject: Project) =>
      buildWidgetEditorConfig(
        previewProjectKey,
        nextProject.settings?.widget_config || {},
        { appOrigin },
      ),
    [appOrigin, previewProjectKey],
  )

  const loadLatestProject = React.useCallback(async () => {
    const response = await fetch(`/api/projects/${project.id}`, {
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.updated_at) {
      throw new Error(readErrorMessage(payload, 'The latest saved feedback form could not be loaded.'))
    }
    return payload as Project
  }, [project.id])

  React.useEffect(() => {
    let cancelled = false

    void loadLatestProject()
      .then((latestProject) => {
        if (cancelled) return
        setProjectVersion(latestProject.updated_at)
        setSavedConfig(editorConfigFromProject(latestProject))
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [editorConfigFromProject, loadLatestProject])

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
    setFieldErrors((current) => ({ ...current, [key]: '' }))
    setSaveError('')
  }

  const selectEmbedMode = (mode: EmbedMode) => {
    setConfig((current) => {
      const currentMode = current.embedMode || 'modal'
      if (currentMode === mode) return current
      return {
        ...current,
        embedMode: mode,
        target: mode === 'modal' ? undefined : getDefaultWidgetTarget(mode, previewProjectKey),
      }
    })
    setFieldErrors((current) => ({ ...current, embedMode: '', target: '' }))
    setSaveError('')
  }

  const handleReset = () => {
    setConfig(savedConfig)
    setDraftRestored(false)
    setConflictingProject(null)
    setSaveError('')
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey)
    }
  }

  const reloadSavedSettings = async () => {
    setSaving(true)
    try {
      const latestProject = await loadLatestProject()
      const latestConfig = editorConfigFromProject(latestProject)
      setProjectVersion(latestProject.updated_at)
      setSavedConfig(latestConfig)
      setConfig(latestConfig)
      setConflictingProject(null)
      setSaveError('')
      setDraftRestored(false)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey)
      }
      toast({ title: 'Latest saved feedback form loaded' })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The latest saved feedback form could not be loaded.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaveError('')
    setFieldErrors({})
    const primaryColor = config.primaryColor?.trim() || ''
    if (!HEX_COLOR_RE.test(primaryColor)) {
      setFieldErrors({ primaryColor: 'Enter a hex color such as #6366f1.' })
      setSaveError('Review the highlighted feedback form field.')
      window.requestAnimationFrame(() => document.getElementById('primary-color-hex')?.focus())
      return
    }
    setSaving(true)
    try {
      let expectedVersion = projectVersion
      let payload: Project | null = null

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...mutationVersionHeaders(expectedVersion),
          },
          body: JSON.stringify({
            settings: { widget_config: config },
          }),
        })
        const data = await response.json().catch(() => null)

        if (response.ok) {
          payload = data as Project
          break
        }

        if (response.status === 409 && data?.code === 'EDIT_CONFLICT') {
          const latestProject = await loadLatestProject()
          const latestConfig = editorConfigFromProject(latestProject)
          const latestFingerprint = fingerprintConfig(latestConfig)

          if (latestFingerprint === draftFingerprint) {
            setProjectVersion(latestProject.updated_at)
            setSavedConfig(latestConfig)
            setConfig(latestConfig)
            setConflictingProject(null)
            setDraftRestored(false)
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem(storageKey)
            }
            toast({
              title: 'Feedback form already saved',
              description: 'The saved version already matches this draft.',
            })
            return
          }

          if (attempt === 0 && latestFingerprint === savedFingerprint) {
            expectedVersion = latestProject.updated_at
            setProjectVersion(latestProject.updated_at)
            setSavedConfig(latestConfig)
            continue
          }

          setConflictingProject(latestProject)
          setSaveError('The saved feedback form changed while this draft was open. Reload the saved settings, review them, then make your changes again.')
          return
        }

        setFieldErrors(readFieldErrors(data))
        throw new Error(readErrorMessage(data, 'Failed to save widget settings'))
      }

      if (!payload) throw new Error('Failed to save widget settings')
      setProjectVersion(payload.updated_at)
      const nextSavedConfig = buildWidgetEditorConfig(previewProjectKey, payload.settings?.widget_config || {}, { appOrigin })
      setSavedConfig(nextSavedConfig)
      setConfig(nextSavedConfig)
      setConflictingProject(null)

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey)
      }
      setDraftRestored(false)
      toast({
        title: 'Feedback form updated',
        description: nextSavedConfig.embedMode === 'trigger'
          ? `The shared embed stays unchanged. Make sure your button matches ${nextSavedConfig.target}.`
          : nextSavedConfig.embedMode === 'inline'
            ? 'The installed host now renders the inline form remotely. Move only the host element if you want the form somewhere else.'
            : 'Installed embeds will use this floating-button configuration remotely. No code change is required.',
      })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Feedback form settings could not be saved. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const embedMode = config.embedMode || 'modal'
  const isFloatingButton = embedMode === 'modal'
  const isInlineForm = embedMode === 'inline'
  const inlineHostMarkup = `<div data-feedbacks-host="${previewProjectKey}"></div>`
  const triggerSelector = runtimePreviewConfig.target || getDefaultWidgetTarget('trigger', previewProjectKey) || '#feedback-button'
  const triggerMarkup = triggerMarkupForSelector(triggerSelector)

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={project.name}
        title="Feedback form"
        description={hasUnsavedChanges
          ? 'Preview the draft, then save once to publish it to every installed embed.'
          : 'Edit the saved form without replacing the installed snippet.'}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>{hasUnsavedChanges ? 'Unsaved draft' : 'Saved'}</Badge>
            <span>{draftModeLabel}</span>
            <span>Saved placement: {savedModeLabel}</span>
            {draftRestored && hasUnsavedChanges && <span>Local draft restored</span>}
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card data-tour="widget-settings">
          <CardHeader>
            <CardTitle className="text-lg">Widget settings</CardTitle>
            <CardDescription>
              Choose where feedback appears, then tune the form details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-7">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Placement</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose how the feedback form appears. The shared embed applies this remotely.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    mode: 'modal',
                    title: 'Floating button',
                    body: 'Adds a feedback button to your site.',
                    Icon: Send,
                  },
                  {
                    mode: 'trigger',
                    title: 'Custom trigger',
                    body: 'Connects feedback to your own button.',
                    Icon: MousePointerClick,
                  },
                  {
                    mode: 'inline',
                    title: 'Inline form',
                    body: 'Embeds the full form on a page.',
                    Icon: PanelTop,
                  },
                ].map(({ mode, title, body, Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={embedMode === mode}
                    onClick={() => selectEmbedMode(mode as EmbedMode)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      embedMode === mode
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-foreground/10 hover:bg-muted/25'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                  </button>
                ))}
              </div>

              <div className="border-y bg-muted/20 px-4 py-4">
                {isFloatingButton ? (
                  <div>
                    <p className="text-sm font-semibold text-foreground">No code change needed</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Save this setting and every installed embed switches to the floating launcher remotely. Keep the original host and script exactly where they are.
                    </p>
                  </div>
                ) : isInlineForm ? (
                  <div>
                    <p className="text-sm font-semibold text-foreground">The existing host becomes the inline form</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Save this setting to switch remotely. You do not replace the script. If the form should appear somewhere else, move only this host element to that location in your page.
                    </p>
                    <div className="mt-3 flex items-center gap-2 rounded-md border bg-surface-code p-2 text-surface-code-foreground">
                      <code className="min-w-0 flex-1 overflow-x-auto px-1 text-xs">{inlineHostMarkup}</code>
                      <CopyButton value={inlineHostMarkup} label="Copy host" copiedLabel="Copied" variant="secondary" size="sm" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Connect feedback to your own button</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Keep the shared host and script installed. Add a button that matches this CSS selector wherever you want the trigger to appear. Until it exists, feedbacks.dev keeps a managed fallback button in the original host.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger-selector">Trigger selector</Label>
                      <Input
                        id="trigger-selector"
                        value={config.target || triggerSelector}
                        onChange={(event) => updateConfig('target', event.target.value)}
                        placeholder="#feedback-button"
                        maxLength={120}
                      />
                      <p className="text-xs leading-5 text-muted-foreground">Use an ID, class, or data attribute selector that uniquely identifies your button.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Paste or adapt this where the button should appear</p>
                      <div className="mt-2 flex items-center gap-2 rounded-md border bg-surface-code p-2 text-surface-code-foreground">
                        <code className="min-w-0 flex-1 overflow-x-auto px-1 text-xs">{triggerMarkup}</code>
                        <CopyButton value={triggerMarkup} label="Copy button" copiedLabel="Copied" variant="secondary" size="sm" />
                      </div>
                    </div>
                  </div>
                )}
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
                      value={/^#[0-9a-f]{6}$/i.test(config.primaryColor || '') ? config.primaryColor : '#6366f1'}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="h-11 w-11 cursor-pointer rounded border"
                    />
                    <Input
                      id="primary-color-hex"
                      value={config.primaryColor || ''}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      aria-label="Primary color hex value"
                      aria-invalid={Boolean(fieldErrors.primaryColor)}
                      aria-describedby={fieldErrors.primaryColor ? 'primary-color-error' : undefined}
                    />
                  </div>
                  <FieldError id="primary-color-error">{fieldErrors.primaryColor}</FieldError>
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
                        className="h-11 w-full rounded-md border bg-background px-3 text-sm"
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

            <details className="group rounded-md border bg-surface-raised/45">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Optional fields and protection</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Ratings, screenshots, email, and captcha.</p>
                </div>
                <span className="text-xs font-medium text-primary group-open:hidden">Show</span>
                <span className="hidden text-xs font-medium text-primary group-open:inline">Hide</span>
              </summary>
              <div className="space-y-5 border-t p-4">
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
                  className="flex min-h-11 items-center gap-2 border-b border-foreground/10 px-1 text-sm transition-colors hover:bg-muted/20"
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

                <div className="border-t pt-4">
                  <label className="flex min-h-11 items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={!!config.requireCaptcha}
                      onChange={(e) => updateConfig('requireCaptcha', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4 text-muted-foreground" />Require human verification</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">Keep this off until the form works. Enable it when a public form needs stronger abuse protection.</span>
                    </span>
                  </label>
                  {config.requireCaptcha && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="captcha-provider">Provider</Label>
                        <select
                          id="captcha-provider"
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={config.captchaProvider || 'turnstile'}
                          onChange={(e) => updateConfig('captchaProvider', e.target.value)}
                        >
                          <option value="turnstile">Cloudflare Turnstile</option>
                          <option value="hcaptcha">hCaptcha</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="captcha-site-key">Site key</Label>
                        <Input
                          id="captcha-site-key"
                          value={(config.captchaProvider || 'turnstile') === 'hcaptcha' ? config.hcaptchaSiteKey || '' : config.turnstileSiteKey || ''}
                          onChange={(e) => updateConfig((config.captchaProvider || 'turnstile') === 'hcaptcha' ? 'hcaptchaSiteKey' : 'turnstileSiteKey', e.target.value)}
                          placeholder="Public site key"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        <Card data-tour="widget-preview" className="xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle className="text-lg">Live form preview</CardTitle>
            <CardDescription>
              Placement, color, copy, and optional fields update as you edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={hasUnsavedChanges ? 'default' : 'secondary'}>
                {hasUnsavedChanges ? 'Previewing unsaved changes' : 'Showing saved version'}
              </Badge>
              <Badge variant="outline">{draftModeLabel}</Badge>
            </div>

            <WidgetFormPreview config={config} />
          </CardContent>
        </Card>
      </div>

      {hasUnsavedChanges && (
        <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 rounded-lg border border-amber-300/80 bg-amber-50 p-3 shadow-lg dark:bg-amber-950">
          {conflictingProject ? (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3" role="alert">
              <p className="text-sm font-semibold text-foreground">Saved settings changed</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{saveError}</p>
            </div>
          ) : (
            <FormErrorSummary className="mb-3">{saveError}</FormErrorSummary>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Publish remote changes</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Installed embeds keep using the last saved version until you save. Unsaved changes: {changedFieldsSummary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving || Boolean(conflictingProject)}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
              <Button
                variant="outline"
                onClick={conflictingProject ? () => void reloadSavedSettings() : handleReset}
                disabled={saving}
              >
                {conflictingProject ? 'Reload saved settings' : 'Discard'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
