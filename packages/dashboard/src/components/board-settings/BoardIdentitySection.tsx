'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkspaceSection } from '@/components/ui/workspace-section'
import type { BoardBranding } from '@/lib/public-board'
import { FieldError } from '@/components/ui/field-error'
import type { FieldErrors } from '@/lib/form-errors'

interface BoardSettingsSlice {
  display_name: string
  slug: string
}

interface BoardIdentitySectionProps {
  projectId: string
  boardUrl: string
  settings: BoardSettingsSlice & { branding: BoardBranding }
  onSettingsChange: (patch: Partial<BoardSettingsSlice>) => void
  onBrandingChange: (patch: Partial<BoardBranding>) => void
  slugManuallyEdited: React.RefObject<boolean>
  fieldErrors?: FieldErrors
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function BoardIdentitySection({
  projectId,
  boardUrl,
  settings,
  onSettingsChange,
  onBrandingChange,
  slugManuallyEdited,
  fieldErrors = {},
}: BoardIdentitySectionProps) {
  const [slugStatus, setSlugStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const handleDisplayNameChange = (value: string) => {
    const clamped = value.slice(0, 60)
    onSettingsChange({ display_name: clamped })

    if (!slugManuallyEdited.current) {
      onSettingsChange({ display_name: clamped, slug: slugify(clamped) })
    }
  }

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true
    onSettingsChange({ slug: slugify(value) })
  }

  React.useEffect(() => {
    if (!settings.slug) {
      setSlugStatus('idle')
      return
    }
    const controller = new AbortController()
    setSlugStatus('checking')
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/board?checkSlug=${encodeURIComponent(settings.slug)}`,
          { cache: 'no-store', signal: controller.signal },
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error('check failed')
        setSlugStatus(payload?.available ? 'available' : 'taken')
      } catch {
        if (!controller.signal.aborted) setSlugStatus('error')
      }
    }, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [projectId, settings.slug])

  return (
    <WorkspaceSection title="Name and look" description="Set the name, link, mark, and color users will see.">
        <div className="space-y-2">
          <Label htmlFor="board-display-name">Display name</Label>
          <Input
            id="board-display-name"
            value={settings.display_name}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            placeholder="My Product"
            maxLength={60}
            aria-invalid={Boolean(fieldErrors.display_name)}
            aria-describedby={fieldErrors.display_name ? 'board-display-name-error' : 'board-display-name-help'}
          />
          <p id="board-display-name-help" className="text-xs text-muted-foreground">
            The name users see on your public board.
          </p>
          <FieldError id="board-display-name-error">{fieldErrors.display_name}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="board-slug">Slug</Label>
          <div className="flex gap-2">
            <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
              /p/
            </div>
            <Input
              id="board-slug"
              value={settings.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-product"
              aria-invalid={Boolean(fieldErrors.slug || slugStatus === 'taken')}
              aria-describedby={fieldErrors.slug ? 'board-slug-error' : 'board-slug-status'}
            />
          </div>
          <p
            id="board-slug-status"
            role="status"
            aria-live="polite"
            className={slugStatus === 'taken' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
          >
            {slugStatus === 'checking' && 'Checking availability…'}
            {slugStatus === 'available' && 'This public link is available.'}
            {slugStatus === 'taken' && 'That link is already in use. Choose another slug.'}
            {slugStatus === 'error' && 'Availability could not be checked. It will be checked again when you save.'}
          </p>
          <FieldError id="board-slug-error">{fieldErrors.slug}</FieldError>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="board-logo-mark">Logo mark</Label>
            <Input
              id="board-logo-mark"
              value={settings.branding.logoEmoji || ''}
              onChange={(e) => onBrandingChange({ logoEmoji: e.target.value })}
              placeholder="◦"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-accent-color">Accent color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="board-accent-color"
                value={settings.branding.accentColor || '#0f766e'}
                onChange={(e) => onBrandingChange({ accentColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                id="board-accent-color-hex"
                value={settings.branding.accentColor || ''}
                onChange={(e) => onBrandingChange({ accentColor: e.target.value })}
                placeholder="#0f766e"
                aria-label="Accent color hex value"
                aria-invalid={Boolean(fieldErrors.accentColor)}
                aria-describedby={fieldErrors.accentColor ? 'board-accent-color-error' : undefined}
              />
            </div>
            <FieldError id="board-accent-color-error">{fieldErrors.accentColor}</FieldError>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="board-website-url">Website URL</Label>
          <Input
            id="board-website-url"
            value={settings.branding.websiteUrl || ''}
            onChange={(e) => onBrandingChange({ websiteUrl: e.target.value })}
            placeholder="https://example.com"
            inputMode="url"
            aria-invalid={Boolean(fieldErrors.websiteUrl)}
            aria-describedby={fieldErrors.websiteUrl ? 'board-website-url-error' : undefined}
          />
          <FieldError id="board-website-url-error">{fieldErrors.websiteUrl}</FieldError>
        </div>

        <div className="space-y-2 border-t pt-5">
          <p className="text-sm font-medium">Search and share preview</p>
          <div className="rounded-lg border bg-[oklch(var(--surface-inset))] p-4">
            <p className="truncate text-xs text-muted-foreground">{boardUrl}</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {settings.display_name || 'Your product'} feedback
            </p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Share ideas, vote on requests, and follow what ships.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Published pages include a canonical URL and safe social sharing metadata.
          </p>
        </div>
    </WorkspaceSection>
  )
}
