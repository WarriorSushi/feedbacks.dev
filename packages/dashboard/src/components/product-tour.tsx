'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { GUIDED_TUTORIAL_PROGRESS_KEY, getGuidedTutorial, resolveTutorialHref, type GuidedTutorialId, type GuidedTutorialProgress } from '@/lib/guided-tutorials'
import { getTourPanelPosition } from '@/lib/tour-position'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
  radius: number
}

const SPOTLIGHT_PADDING = 8
const PANEL_WIDTH = 360
const PANEL_HEIGHT_ESTIMATE = 284
const EMPTY_TUTORIAL_PROGRESS: Record<string, GuidedTutorialProgress> = {}

function readTutorialProgress(id: GuidedTutorialId): GuidedTutorialProgress | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(GUIDED_TUTORIAL_PROGRESS_KEY) || '{}') as Record<string, GuidedTutorialProgress>
    return stored[id] || null
  } catch {
    return null
  }
}

function writeTutorialProgress(id: GuidedTutorialId, progress: GuidedTutorialProgress) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(GUIDED_TUTORIAL_PROGRESS_KEY) || '{}') as Record<string, GuidedTutorialProgress>
    window.localStorage.setItem(GUIDED_TUTORIAL_PROGRESS_KEY, JSON.stringify({ ...stored, [id]: progress }))
    window.dispatchEvent(new CustomEvent('feedbacks:tutorial-progress'))
  } catch {
    // The tutorial still works when browser storage is unavailable.
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isCurrentHref(pathname: string, searchParams: URLSearchParams, href: string) {
  const [targetPath, targetSearch = ''] = href.split('?')
  if (pathname !== targetPath) return false

  const expected = new URLSearchParams(targetSearch)
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) return false
  }
  return true
}

function getTourTarget(selector: string): HTMLElement | null {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector))
  return targets.find((target) => {
    const rect = target.getBoundingClientRect()
    const style = window.getComputedStyle(target)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.width > 0 &&
      rect.height > 0
    )
  }) || null
}

function getVisibleTourTarget(selector: string): HTMLElement | null {
  const target = getTourTarget(selector)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    ) ? target : null
}

function getSpotlightRect(selector: string): SpotlightRect | null {
  const target = getVisibleTourTarget(selector)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  const top = Math.max(SPOTLIGHT_PADDING, rect.top - SPOTLIGHT_PADDING)
  const left = Math.max(SPOTLIGHT_PADDING, rect.left - SPOTLIGHT_PADDING)
  const width = Math.min(window.innerWidth - left - SPOTLIGHT_PADDING, rect.width + SPOTLIGHT_PADDING * 2)
  const height = Math.min(window.innerHeight - top - SPOTLIGHT_PADDING, rect.height + SPOTLIGHT_PADDING * 2)
  const style = window.getComputedStyle(target)
  const targetRadius = Math.max(
    Number.parseFloat(style.borderTopLeftRadius) || 0,
    Number.parseFloat(style.borderTopRightRadius) || 0,
    Number.parseFloat(style.borderBottomRightRadius) || 0,
    Number.parseFloat(style.borderBottomLeftRadius) || 0,
  )
  const radius = Math.min(targetRadius + SPOTLIGHT_PADDING, width / 2, height / 2)

  return { top, left, width, height, radius }
}

export function ProductTour({
  initialOpen,
  defaultProjectId,
  initialTutorialProgress = EMPTY_TUTORIAL_PROGRESS,
}: {
  initialOpen: boolean
  defaultProjectId?: string
  initialTutorialProgress?: Record<string, GuidedTutorialProgress>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])
  const [open, setOpen] = React.useState(false)
  const [stepIndex, setStepIndex] = React.useState(0)
  const [tutorialId, setTutorialId] = React.useState<GuidedTutorialId>('navigation')
  const [pendingStepIndex, setPendingStepIndex] = React.useState<number | null>(null)
  const [spotlight, setSpotlight] = React.useState<SpotlightRect | null>(null)
  const [viewport, setViewport] = React.useState({ width: 1024, height: 768 })
  const [panelSize, setPanelSize] = React.useState({ width: PANEL_WIDTH, height: PANEL_HEIGHT_ESTIMATE })
  const [saving, setSaving] = React.useState(false)
  const tutorialSaveQueue = React.useRef(Promise.resolve())
  const panelRef = React.useRef<HTMLDivElement>(null)
  const maskId = React.useId().replace(/:/g, '')

  const tutorial = getGuidedTutorial(tutorialId) || getGuidedTutorial('navigation')!
  const steps = React.useMemo(
    () => tutorial.steps.map((step) => ({ ...step, href: resolveTutorialHref(step.href, defaultProjectId) })),
    [defaultProjectId, tutorial],
  )
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)]
  const requestedTutorialId = searchParams.get('tutorial')
  const navigationTourRequested = searchParams.get('tour') === '1'

  React.useEffect(() => {
    if (initialOpen && pathname === '/dashboard') setOpen(true)
  }, [initialOpen, pathname])

  React.useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  React.useEffect(() => {
    const requestedTutorial = getGuidedTutorial(requestedTutorialId)
    if (requestedTutorial) {
      const saved = readTutorialProgress(requestedTutorial.id) || initialTutorialProgress[requestedTutorial.id]
      setTutorialId(requestedTutorial.id)
      setStepIndex(saved?.completedAt ? 0 : Math.min(saved?.stepIndex || 0, requestedTutorial.steps.length - 1))
      setOpen(true)
    } else if (navigationTourRequested) {
      setTutorialId('navigation')
      setStepIndex(0)
      setOpen(true)
    }
  }, [initialTutorialProgress, navigationTourRequested, requestedTutorialId])

  React.useEffect(() => {
    const startTour = () => {
      setTutorialId('navigation')
      setStepIndex(0)
      setOpen(true)
    }
    window.addEventListener('feedbacks:start-product-tour', startTour)
    return () => window.removeEventListener('feedbacks:start-product-tour', startTour)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const targetHref = pendingStepIndex === null ? activeStep.href : steps[pendingStepIndex].href
    let attempts = 0
    const navigate = () => {
      const currentSearch = new URLSearchParams(window.location.search)
      if (isCurrentHref(window.location.pathname, currentSearch, targetHref)) return true
      attempts += 1
      router.push(targetHref)
      return false
    }
    if (navigate()) return
    const retry = window.setInterval(() => {
      if (navigate() || attempts >= 12) window.clearInterval(retry)
    }, 1_500)
    return () => window.clearInterval(retry)
  }, [activeStep.href, open, pathname, pendingStepIndex, router, searchParams, steps])

  React.useEffect(() => {
    if (!open) return
    window.dispatchEvent(new CustomEvent('feedbacks:expand-sidebar'))

    let frame = 0
    const measureSpotlight = () => {
      frame = window.requestAnimationFrame(() => {
        setSpotlight(getSpotlightRect(activeStep.target))
      })
    }
    const focusTarget = () => {
      const target = getTourTarget(activeStep.target)
      if (!target) return false
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
      measureSpotlight()
      return true
    }

    measureSpotlight()
    let retryTimer = 0
    const timer = window.setTimeout(() => {
      if (focusTarget()) return
      let attempts = 0
      retryTimer = window.setInterval(() => {
        attempts += 1
        if (focusTarget() || attempts >= 16) window.clearInterval(retryTimer)
      }, 180)
    }, 120)
    window.addEventListener('resize', measureSpotlight)
    window.addEventListener('scroll', measureSpotlight, true)

    return () => {
      window.clearTimeout(timer)
      window.clearInterval(retryTimer)
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureSpotlight)
      window.removeEventListener('scroll', measureSpotlight, true)
    }
  }, [activeStep.target, open, pathname, searchParams])

  React.useLayoutEffect(() => {
    if (!open || !panelRef.current) return
    const panel = panelRef.current
    const measure = () => {
      const rect = panel.getBoundingClientRect()
      setPanelSize({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    return () => observer.disconnect()
  }, [activeStep.body, activeStep.title, open])

  const savePreference = async (key: 'productTourCompletedAt' | 'productTourDismissedAt') => {
    setSaving(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message || 'Sign in again to save tour progress.')
      }

      const { data: existing, error: loadError } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle()

      if (loadError) throw loadError

      const preferences =
        existing?.preferences && typeof existing.preferences === 'object'
          ? (existing.preferences as Record<string, unknown>)
          : {}

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferences: {
            ...preferences,
            [key]: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    } finally {
      setSaving(false)
    }
  }

  const saveTutorialProgress = React.useCallback((id: GuidedTutorialId, progress: GuidedTutorialProgress) => {
    writeTutorialProgress(id, progress)
    tutorialSaveQueue.current = tutorialSaveQueue.current.then(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: existing } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle()
      const preferences = existing?.preferences && typeof existing.preferences === 'object'
        ? existing.preferences as Record<string, unknown>
        : {}
      const guidedTutorialProgress = preferences.guidedTutorialProgress && typeof preferences.guidedTutorialProgress === 'object'
        ? preferences.guidedTutorialProgress as Record<string, GuidedTutorialProgress>
        : {}
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        preferences: {
          ...preferences,
          guidedTutorialProgress: { ...guidedTutorialProgress, [id]: progress },
        },
        updated_at: new Date().toISOString(),
      })
    }).catch(() => undefined)
  }, [supabase])

  React.useEffect(() => {
    if (pendingStepIndex === null) return
    const pendingStep = steps[pendingStepIndex]
    if (!isCurrentHref(pathname, searchParams, pendingStep.href)) return

    setStepIndex(pendingStepIndex)
    if (tutorialId !== 'navigation') saveTutorialProgress(tutorialId, { stepIndex: pendingStepIndex })
    setPendingStepIndex(null)
  }, [pathname, pendingStepIndex, saveTutorialProgress, searchParams, steps, tutorialId])

  const closeTour = React.useCallback((returnToDashboard = false) => {
    setOpen(false)
    setSpotlight(null)
    if (returnToDashboard) {
      router.replace('/dashboard')
      return
    }
    if (pathname === '/dashboard' && searchParams.get('tour') === '1') {
      router.replace('/dashboard')
    }
  }, [pathname, router, searchParams])

  const goToStep = (nextIndex: number) => {
    const safeIndex = clamp(nextIndex, 0, steps.length - 1)
    const nextStep = steps[safeIndex]
    if (!isCurrentHref(pathname, searchParams, nextStep.href)) {
      setPendingStepIndex(safeIndex)
      router.push(nextStep.href)
      return
    }
    setStepIndex(safeIndex)
    if (tutorialId !== 'navigation') saveTutorialProgress(tutorialId, { stepIndex: safeIndex })
  }

  const skipTour = async () => {
    try {
      if (tutorialId === 'navigation') await savePreference('productTourDismissedAt')
      else saveTutorialProgress(tutorialId, { stepIndex, dismissedAt: new Date().toISOString() })
      toast({ title: tutorialId === 'navigation' ? 'Tour hidden for now' : 'Tutorial saved for later' })
      closeTour()
    } catch (error) {
      toast({
        title: 'Could not hide tour',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const finishTour = async () => {
    try {
      if (tutorialId === 'navigation') {
        await savePreference('productTourCompletedAt')
        toast({ title: 'Product tour complete' })
        closeTour(true)
      } else {
        saveTutorialProgress(tutorialId, { stepIndex: steps.length - 1, completedAt: new Date().toISOString() })
        toast({ title: `${tutorial.title} complete` })
        setOpen(false)
        setSpotlight(null)
        router.replace('/tutorials')
      }
    } catch (error) {
      toast({
        title: 'Could not save tour progress',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!open) return null

  const isSidebarStep = activeStep.target.includes('nav-')
  const panelPosition = getTourPanelPosition({
    spotlight,
    panel: panelSize,
    viewport,
    sidebarStep: isSidebarStep,
  })
  const finalStep = stepIndex === steps.length - 1

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {spotlight ? (
        <svg
          aria-hidden="true"
          className="pointer-events-auto fixed inset-0 h-full w-full"
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect width={viewport.width} height={viewport.height} fill="white" />
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx={spotlight.radius}
                fill="black"
              />
            </mask>
          </defs>
          <rect width={viewport.width} height={viewport.height} fill="rgba(0,0,0,0.52)" mask={`url(#${maskId})`} />
          <rect
            x={spotlight.left}
            y={spotlight.top}
            width={spotlight.width}
            height={spotlight.height}
            rx={spotlight.radius}
            fill="none"
            stroke="oklch(var(--primary))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 2px 6px rgb(0 0 0 / 0.35))' }}
          />
        </svg>
      ) : (
        <div className="pointer-events-auto fixed inset-0 bg-black/60" />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-description"
        className="pointer-events-auto fixed w-[calc(100vw-2rem)] max-w-[360px] rounded-lg border bg-card p-5 shadow-[0_24px_70px_rgb(0_0_0/0.32)]"
        style={{ top: panelPosition.top, left: panelPosition.left }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-primary">
              {tutorial.title} · {stepIndex + 1} of {steps.length}
            </p>
            <h2 id="product-tour-title" className="mt-2 text-base font-semibold">
              {activeStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void skipTour()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Skip tour"
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p id="product-tour-description" className="mt-2 text-sm leading-6 text-muted-foreground">
          {activeStep.body}
        </p>
        {!spotlight && (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Opening the right section now. If the highlight does not appear, use Next to continue.
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0 || saving || pendingStepIndex !== null}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => void skipTour()} disabled={saving || pendingStepIndex !== null}>
              Skip
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                if (finalStep) void finishTour()
                else goToStep(stepIndex + 1)
              }}
              disabled={saving || pendingStepIndex !== null}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : finalStep ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              {finalStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
        <div
          className="mt-3 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => (
            <span
              key={step.title}
              className={cn(
                'h-1 rounded-full',
                index <= stepIndex ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
