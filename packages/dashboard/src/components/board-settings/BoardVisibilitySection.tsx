'use client'

import { Label } from '@/components/ui/label'
import { WorkspaceSection } from '@/components/ui/workspace-section'
import { CURATED_BOARD_CATEGORIES, getBoardCategoryLabel, normalizeBoardCategories } from '@/lib/board-categories'
import { cn } from '@/lib/utils'
import type { BoardBranding } from '@/lib/public-board'

interface BoardVisibilitySettings {
  enabled: boolean
  branding: BoardBranding
}

interface BoardVisibilitySectionProps {
  settings: BoardVisibilitySettings
  onSettingsChange: (patch: Partial<BoardVisibilitySettings>) => void
  onBrandingChange: (patch: Partial<BoardBranding>) => void
}

export function BoardVisibilitySection({
  settings,
  onSettingsChange,
  onBrandingChange,
}: BoardVisibilitySectionProps) {
  const visibility = settings.branding.visibility || 'public'
  const listed = visibility === 'public' && settings.branding.directoryOptIn !== false
  const categories = settings.branding.categories || []

  const toggleCategory = (category: string) => {
    const nextCategories = categories.includes(category)
      ? categories.filter((entry) => entry !== category)
      : [...categories, category]
    onBrandingChange({ categories: normalizeBoardCategories(nextCategories) || [] })
  }

  return (
    <WorkspaceSection title="Who can see it" description="Publish when ready, then choose whether people need the link or can discover it in the directory.">
        <label className="flex min-h-12 items-start gap-3 rounded-lg border bg-muted/10 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onSettingsChange({ enabled: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border"
          />
          <span>
            <span className="block font-medium text-foreground">Publish this page</span>
            <span className="text-muted-foreground">
              Turn this on when the page is ready for visitors.
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label>Discovery</Label>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Public board discovery">
            <button
              type="button"
              aria-pressed={!listed}
              onClick={() => onBrandingChange({ visibility: 'unlisted', directoryOptIn: false })}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                !listed ? 'border-primary bg-primary/[0.06]' : 'bg-background hover:bg-accent',
              )}
            >
              <span className="block text-sm font-medium">Unlisted</span>
              <span className="mt-1 block text-xs text-muted-foreground">Anyone with the link can visit.</span>
            </button>
            <button
              type="button"
              aria-pressed={listed}
              onClick={() => onBrandingChange({ visibility: 'public', directoryOptIn: true })}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                listed ? 'border-primary bg-primary/[0.06]' : 'bg-background hover:bg-accent',
              )}
            >
              <span className="block text-sm font-medium">Listed</span>
              <span className="mt-1 block text-xs text-muted-foreground">Eligible for the feedbacks.dev directory.</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Publication controls whether the page is live. Discovery controls whether people can find it without the link.
          </p>
        </div>

        {listed && <div className="space-y-2">
          <Label>Suggested categories</Label>
          <div className="flex flex-wrap gap-2">
            {CURATED_BOARD_CATEGORIES.map((category) => {
              const selected = categories.includes(category)
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {getBoardCategoryLabel(category)}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Select a few categories so relevant visitors can find the page.
          </p>
        </div>}
    </WorkspaceSection>
  )
}
