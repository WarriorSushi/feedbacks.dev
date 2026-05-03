'use client'

import * as React from 'react'
import { Camera, MessageSquareText, MousePointerClick, Star } from 'lucide-react'
import type { SavedWidgetConfig } from '@feedbacks/shared'
import { cn } from '@/lib/utils'

interface WidgetFormPreviewProps {
  config: SavedWidgetConfig
  className?: string
}

function colorOrDefault(value: string | undefined, fallback: string) {
  return value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback
}

function PreviewForm({ config, compact = false }: { config: SavedWidgetConfig; compact?: boolean }) {
  const primary = colorOrDefault(config.primaryColor, '#4d7c0f')
  const title = config.formTitle || 'Send Feedback'
  const placeholder = config.messagePlaceholder || "What's on your mind?"
  const emailLabel = config.emailLabel || (config.requireEmail ? 'Email' : 'Email (optional)')

  return (
    <div
      className={cn(
        'rounded-xl border bg-white text-zinc-950 shadow-sm',
        compact ? 'p-4' : 'p-5',
      )}
      style={{ borderColor: `${primary}26` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold tracking-tight">{title}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {config.formSubtitle || 'Tell the team what happened, what you expected, or what would help.'}
          </p>
        </div>
        <span className="rounded-md border px-2 py-1 text-[10px] font-medium text-zinc-500">
          Preview
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {config.enableType !== false && (
          <div className="grid grid-cols-3 gap-2">
            {['Bug', 'Idea', 'Praise'].map((type, index) => (
              <div
                key={type}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-center text-xs font-medium',
                  index === 1 ? 'text-white' : 'text-zinc-600',
                )}
                style={{
                  backgroundColor: index === 1 ? primary : '#fafafa',
                  borderColor: index === 1 ? primary : '#e4e4e7',
                }}
              >
                {type}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-zinc-700">Your feedback</label>
          <div className="mt-1.5 min-h-[104px] rounded-lg border bg-zinc-50 px-3 py-2.5 text-sm leading-6 text-zinc-500">
            {placeholder}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-700">{emailLabel}</label>
          <div className="mt-1.5 h-10 rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-400">
            you@example.com
          </div>
        </div>

        {config.enableRating !== false && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className="h-4 w-4"
                fill={index < 4 ? primary : 'transparent'}
                color={index < 4 ? primary : '#d4d4d8'}
              />
            ))}
            <span className="ml-2 text-xs text-zinc-500">Great</span>
          </div>
        )}

        {config.enableScreenshot && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-zinc-500">
            <Camera className="h-4 w-4" />
            Screenshot capture enabled
          </div>
        )}

        <button
          type="button"
          className="h-10 w-full rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          {config.submitButtonText || 'Send Feedback'}
        </button>
      </div>
    </div>
  )
}

export function WidgetFormPreview({ config, className }: WidgetFormPreviewProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const mode = config.embedMode || 'modal'
  const primary = colorOrDefault(config.primaryColor, '#4d7c0f')
  const buttonText = config.buttonText || 'Feedback'
  const position = config.position || 'bottom-right'
  const alignLauncher = position.endsWith('left') ? 'justify-start' : 'justify-end'
  const launcherIsTop = position.startsWith('top')

  React.useEffect(() => {
    setIsFormOpen(true)
  }, [mode])

  const launcher = (
    <button
      type="button"
      aria-pressed={isFormOpen}
      onClick={() => setIsFormOpen((open) => !open)}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
      style={{ backgroundColor: primary }}
    >
      <MessageSquareText className="h-4 w-4" />
      {buttonText}
    </button>
  )

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-white', className)}>
      <div className="flex items-center gap-1.5 border-b px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="ml-3 text-[11px] font-medium text-zinc-500">app.example.com</span>
      </div>

      <div className="min-h-[620px] bg-zinc-200 p-4">
        <div className="max-w-md space-y-3">
          <div className="h-8 w-40 rounded bg-zinc-400/70" />
          <div className="h-4 w-64 max-w-full rounded bg-zinc-300" />
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="h-20 rounded-lg border bg-white shadow-sm" />
            <div className="h-20 rounded-lg border bg-white shadow-sm" />
          </div>
        </div>

        {mode === 'inline' ? (
          <div className="mt-6 max-w-lg">
            <PreviewForm config={config} />
          </div>
        ) : (
          <>
            {mode === 'trigger' && (
              <button
                type="button"
                aria-pressed={isFormOpen}
                onClick={() => setIsFormOpen((open) => !open)}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-transform active:scale-[0.98]"
              >
                <MousePointerClick className="h-4 w-4" />
                {isFormOpen ? 'Close feedback' : 'Open feedback'}
              </button>
            )}

            {mode === 'modal' && launcherIsTop && (
              <div className={cn('mt-6 flex', alignLauncher)}>
                {launcher}
              </div>
            )}

            <div className="mt-6 flex min-h-[430px] justify-center">
              {isFormOpen && (
                <div className="w-full max-w-[340px]">
                  <PreviewForm config={config} compact />
                </div>
              )}
            </div>

            {mode === 'modal' && !launcherIsTop && (
              <div className={cn('mt-4 flex', alignLauncher)}>
                {launcher}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
