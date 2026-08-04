'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bug,
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
    title: 'A user found a bug you cannot reproduce.',
    body: 'Page, browser, screenshot, and message arrive together.',
    icon: Bug,
    hue: 136,
  },
  {
    title: 'Three users asked for the same feature.',
    body: 'See every request before you decide what to build.',
    icon: Lightbulb,
    hue: 74,
  },
  {
    title: 'You fixed the problem they reported.',
    body: 'Tell affected users with one short in-app update.',
    icon: Megaphone,
    hue: 198,
  },
  {
    title: 'A beta tester got stuck on one screen.',
    body: 'See their screen before asking a follow-up question.',
    icon: ScanSearch,
    hue: 302,
  },
  {
    title: 'Your client wants one place for feedback.',
    body: 'Share one board for ideas, votes, replies, and status.',
    icon: Map,
    hue: 32,
  },
  {
    title: 'Your AI-built app changes every week.',
    body: 'Change forms and routing without reinstalling anything.',
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
      <div className="auth-use-case-viewport">
        <div
          className="auth-use-case-track"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          aria-live={rotating ? 'off' : 'polite'}
          aria-atomic="false"
        >
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            const active = activeIndex === index
            return (
              <article
                key={useCase.title}
                className="auth-use-case-card"
                aria-hidden={!active}
                aria-label={`${index + 1} of ${useCases.length}: ${useCase.title}`}
                aria-roledescription="slide"
                role="group"
                data-active={active}
                style={{ '--auth-card-hue': useCase.hue } as React.CSSProperties}
              >
                <div className="auth-use-case-copy relative z-[1] flex h-full flex-col">
                  <h2 className="auth-use-case-title max-w-xl text-3xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-[2.05rem]">
                    {useCase.title}
                  </h2>
                  <p className="auth-use-case-body mt-3 max-w-xl truncate text-sm leading-6 text-muted-foreground">
                    {useCase.body}
                  </p>
                  <div className="auth-card-signal" aria-hidden="true">
                    <span className="auth-card-signal-disc">
                      <span className="auth-card-signal-ring" />
                      <span className="auth-card-signal-core"><Icon className="h-5 w-5" /></span>
                    </span>
                  </div>
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
              key={useCase.title}
              type="button"
              aria-label={`Show slide ${index + 1}: ${useCase.title}`}
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
            data-rotation-control
            disabled={reducedMotion}
            onClick={() => setRotationEnabled((enabled) => !enabled)}
            aria-label={reducedMotion
              ? 'Automatic story rotation is unavailable while reduced motion is enabled'
              : rotationEnabled
                ? 'Stop automatic story rotation'
                : 'Start automatic story rotation'}
            title={reducedMotion ? 'Motion reduced' : rotationEnabled ? 'Pause stories' : 'Play stories'}
            className="auth-rotation-control inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background/70 text-foreground disabled:cursor-default disabled:opacity-50"
          >
            {rotationEnabled && !reducedMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
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
