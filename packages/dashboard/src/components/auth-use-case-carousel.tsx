'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  Check,
  Code2,
  Lightbulb,
  Map,
  Megaphone,
  Pause,
  Play,
  ScanSearch,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const useCases = [
  {
    label: 'Reproduce bugs faster',
    title: 'Bug reports arrive with the context your team needs.',
    body: 'Users describe the problem once. The page, browser, device, and optional screenshot stay attached to the report.',
    benefits: ['Less back-and-forth', 'Faster reproduction', 'One focused inbox'],
    icon: Bug,
    hue: 136,
  },
  {
    label: 'Choose the next useful bet',
    title: 'Turn scattered feature requests into credible product signal.',
    body: 'Collect ideas where they happen, group similar requests, and see which problems keep appearing before you commit a sprint.',
    benefits: ['Requests in context', 'Clearer prioritization', 'Private triage first'],
    icon: Lightbulb,
    hue: 74,
  },
  {
    label: 'Close the loop',
    title: 'Show customers when the improvement they asked for ships.',
    body: 'Publish a concise update through the same embed and connect it to the original feedback, without installing another announcement tool.',
    benefits: ['Updates in your product', 'Original request preserved', 'Trust after the fix'],
    icon: Megaphone,
    hue: 198,
  },
  {
    label: 'Keep the useful details',
    title: 'Capture technical context without making users fill a support form.',
    body: 'The form stays lightweight while feedbacks.dev quietly records the environment details that make a report actionable.',
    benefits: ['Small user-facing form', 'Automatic environment data', 'Optional screenshot capture'],
    icon: ScanSearch,
    hue: 302,
  },
  {
    label: 'Invite customers into the roadmap',
    title: 'Publish a feedback board that still feels like your product.',
    body: 'Share selected ideas, collect votes and replies, and keep internal triage separate from the public conversation.',
    benefits: ['Curated public board', 'Votes with context', 'Private work stays private'],
    icon: Map,
    hue: 32,
  },
  {
    label: 'Stay simple as you grow',
    title: 'Install once. Change the workflow without shipping new frontend code.',
    body: 'Start with the recommended snippet, then manage forms, boards, updates, and routing from the dashboard when you need them.',
    benefits: ['Copy-paste setup', 'Remote configuration', 'No all-in-one setup maze'],
    icon: Code2,
    hue: 158,
  },
] as const

type AuthUseCaseCarouselProps = {
  compact?: boolean
  displayMode?: 'desktop' | 'mobile'
}

const AUTO_ADVANCE_MS = 4_800

export function AuthUseCaseCarousel({
  compact = false,
  displayMode = 'desktop',
}: AuthUseCaseCarouselProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [rotationEnabled, setRotationEnabled] = React.useState(true)
  const [pageVisible, setPageVisible] = React.useState(true)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [viewportActive, setViewportActive] = React.useState(true)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(media.matches)
    updateMotionPreference()
    media.addEventListener('change', updateMotionPreference)
    return () => media.removeEventListener('change', updateMotionPreference)
  }, [])

  React.useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  React.useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const updateViewport = () => setViewportActive(displayMode === 'desktop' ? media.matches : !media.matches)
    updateViewport()
    media.addEventListener('change', updateViewport)
    return () => media.removeEventListener('change', updateViewport)
  }, [displayMode])

  const rotating = rotationEnabled && viewportActive && pageVisible && !reducedMotion

  React.useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(
      () => setActiveIndex((current) => (current + 1) % useCases.length),
      AUTO_ADVANCE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [activeIndex, rotating])

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + useCases.length) % useCases.length)
  }

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % useCases.length)
  }

  return (
    <div
      className={cn('auth-use-case-carousel min-w-0', compact ? 'py-4' : 'my-auto py-10')}
      data-compact={compact ? 'true' : 'false'}
      data-display-mode={displayMode}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ways to use feedbacks.dev"
      onClickCapture={(event) => {
        if (!(event.target as Element).closest('[data-rotation-control]')) setRotationEnabled(false)
      }}
      onFocusCapture={(event) => {
        if (!(event.target as Element).closest('[data-rotation-control]')) setRotationEnabled(false)
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Built for the whole feedback loop
        </p>
        <button
          type="button"
          data-rotation-control
          disabled={reducedMotion}
          onClick={() => setRotationEnabled((enabled) => !enabled)}
          aria-label={reducedMotion
            ? 'Automatic story rotation is unavailable while reduced motion is enabled'
            : rotationEnabled
              ? 'Stop automatic story rotation'
              : 'Start automatic story rotation'}
          className="auth-rotation-control inline-flex min-h-9 items-center gap-2 rounded-full border bg-background/65 px-3 text-[11px] font-semibold text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground disabled:cursor-default disabled:opacity-55"
        >
          {rotationEnabled && !reducedMotion ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {reducedMotion ? 'Motion reduced' : rotationEnabled ? 'Auto-playing' : 'Play stories'}
        </button>
      </div>

      <div className="auth-use-case-viewport">
        <div
          className="auth-use-case-track"
          style={{ transform: `translate3d(calc(${activeIndex * (compact ? 0.625 : 2.5)}rem - ${activeIndex * 100}%), 0, 0)` }}
          aria-live={rotating ? 'off' : 'polite'}
          aria-atomic="false"
        >
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            const active = activeIndex === index
            return (
              <article
                key={useCase.label}
                className="auth-use-case-card"
                aria-hidden={!active}
                aria-label={`${index + 1} of ${useCases.length}: ${useCase.label}`}
                aria-roledescription="slide"
                role="group"
                data-active={active}
                style={{ '--auth-card-hue': useCase.hue } as React.CSSProperties}
              >
                <div className="auth-card-signal" aria-hidden="true">
                  <span className="auth-card-signal-glow" />
                  <span className="auth-card-signal-disc">
                    <span className="auth-card-signal-ring" />
                    <span className="auth-card-signal-core"><Icon className="h-5 w-5" /></span>
                  </span>
                  <span className="auth-card-signal-spark" />
                </div>
                <div className="auth-use-case-copy relative z-[1] flex h-full flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      <Icon className="h-4 w-4" />
                      {useCase.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, '0')} / {String(useCases.length).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="auth-use-case-title mt-7 max-w-lg text-3xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-[2.05rem]">
                    {useCase.title}
                  </h2>
                  <p className="auth-use-case-body mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
                    {useCase.body}
                  </p>
                  <ul className="auth-use-case-benefits mt-auto grid gap-2 pt-7 text-xs text-foreground/80 sm:grid-cols-3">
                    {useCase.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-5">
        <div className="flex items-center gap-1.5" aria-label="Choose a use case">
          {useCases.map((useCase, index) => (
            <button
              key={useCase.label}
              type="button"
              aria-label={`Show slide ${index + 1}: ${useCase.label}`}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'auth-carousel-dot relative h-1.5 overflow-hidden rounded-full',
                activeIndex === index
                  ? 'w-9 bg-primary/20'
                  : 'w-3 bg-foreground/20 hover:bg-foreground/40',
              )}
            >
              {activeIndex === index && (
                <span
                  key={`${activeIndex}-${rotationEnabled}`}
                  className="auth-carousel-dot-progress absolute inset-y-0 left-0 w-full origin-left bg-primary"
                  style={{ animationPlayState: rotating ? 'running' : 'paused' }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Show previous use case"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background/70 text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Show next use case"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background/70 text-foreground transition-colors hover:bg-accent"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
