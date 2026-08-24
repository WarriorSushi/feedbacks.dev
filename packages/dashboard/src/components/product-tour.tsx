'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Lightbulb, Loader2, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { GUIDED_TUTORIAL_PROGRESS_KEY, getGuidedTutorial, isUsableTutorialProjectId, resolveTutorialHref, usesBuiltInTutorialWorkspace, withTutorialContext, type GuidedTutorialId, type GuidedTutorialProgress } from '@/lib/guided-tutorials'
import { getTourPanelPosition } from '@/lib/tour-position'
import { MascotSpotlight, type MascotVariant } from '@/components/mascot-spotlight'

const ProductTourDemo = dynamic(
  () => import('@/components/product-tour-demo').then((module) => module.ProductTourDemo),
  { ssr: false },
)

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
  radius: number
}

const SPOTLIGHT_PADDING = 8
const SIDEBAR_SPOTLIGHT_PADDING = 1
const PANEL_WIDTH = 420
const PANEL_HEIGHT_ESTIMATE = 360
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

function getTourTarget(selector: string, demoMode = false): HTMLElement | null {
  const scope = demoMode
    ? document.querySelector<HTMLElement>('[data-tour-demo-root]')
    : document
  if (!scope) return null
  const targets = Array.from(scope.querySelectorAll<HTMLElement>(selector))
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

function getVisibleTourTarget(selector: string, demoMode = false): HTMLElement | null {
  const target = getTourTarget(selector, demoMode)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    ) ? target : null
}

function getSpotlightRect(selector: string, demoMode = false): SpotlightRect | null {
  const target = getVisibleTourTarget(selector, demoMode)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  const padding = isSidebarTourTarget(selector) ? SIDEBAR_SPOTLIGHT_PADDING : SPOTLIGHT_PADDING
  const viewportInset = Math.min(padding, SPOTLIGHT_PADDING)
  const top = Math.max(viewportInset, rect.top - padding)
  const left = Math.max(viewportInset, rect.left - padding)
  const right = Math.min(window.innerWidth - viewportInset, rect.right + padding)
  const bottom = Math.min(window.innerHeight - viewportInset, rect.bottom + padding)
  const width = Math.max(0, right - left)
  const height = Math.max(0, bottom - top)
  const style = window.getComputedStyle(target)
  const targetRadius = Math.max(
    Number.parseFloat(style.borderTopLeftRadius) || 0,
    Number.parseFloat(style.borderTopRightRadius) || 0,
    Number.parseFloat(style.borderBottomRightRadius) || 0,
    Number.parseFloat(style.borderBottomLeftRadius) || 0,
  )
  const radius = Math.min(targetRadius + padding, width / 2, height / 2)

  return { top, left, width, height, radius }
}

function isSidebarTourTarget(selector: string) {
  return selector.includes('nav-')
    || selector.includes('project-switcher')
    || selector.includes('theme-switcher')
}

function getTourMascotVariant(target: string): MascotVariant {
  if (target.includes('theme') || target.includes('widget-')) return 'settings'
  if (target.includes('install') || target.includes('verify')) return 'docs'
  return 'tour'
}

export function ProductTour({
  initialOpen,
  defaultProjectId,
  initialTutorialProgress = EMPTY_TUTORIAL_PROGRESS,
  required = false,
}: {
  initialOpen: boolean
  defaultProjectId?: string
  initialTutorialProgress?: Record<string, GuidedTutorialProgress>
  required?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])
  const [open, setOpen] = React.useState(false)
  const [welcomeOpen, setWelcomeOpen] = React.useState(false)
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
  const handledStandardInitialOffer = React.useRef(false)
  const previousNavigationTourRequest = React.useRef(false)
  const initializedRequiredTour = React.useRef(false)
  const previousRecoveryRequest = React.useRef(false)
  const [activeProjectId, setActiveProjectId] = React.useState(
    isUsableTutorialProjectId(defaultProjectId) ? defaultProjectId : undefined,
  )

  const tutorial = getGuidedTutorial(tutorialId) || getGuidedTutorial('navigation')!
  const demoMode = usesBuiltInTutorialWorkspace(tutorial.id)
  const steps = React.useMemo(
    () => tutorial.steps.map((step, index) => {
      const needsProject = step.href.includes('{projectId}')
      const waitingForProject = !demoMode && needsProject && !isUsableTutorialProjectId(activeProjectId)
      const resolvedStep = waitingForProject
        ? {
            ...step,
            title: 'Create your first project to continue',
            body: 'A project keeps one product’s feedback form, inbox, installation, updates, board, and integrations together. Give your app or website a name here; the tour will continue automatically after it is created.',
            href: '/projects/new',
            target: '[data-tour="project-create-form"]',
            tip: 'Only the project name is required. You can add the domain and change every setting later.',
          }
        : demoMode
          ? { ...step, href: '/dashboard' }
          : { ...step, href: resolveTutorialHref(step.href, activeProjectId) }
      return {
        ...resolvedStep,
        href: withTutorialContext(resolvedStep.href, tutorial.id, index),
        waitingForProject,
      }
    }),
    [activeProjectId, demoMode, tutorial],
  )
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)]
  const requestedTutorialId = searchParams.get('tutorial') || searchParams.get('guidedTour')
  const navigationTourRequested = searchParams.get('tour') === '1'

  const getResumeStep = React.useCallback((id: GuidedTutorialId, stepCount: number) => {
    const requestedStep = Number.parseInt(searchParams.get('tourStep') || '', 10)
    if (Number.isInteger(requestedStep)) return clamp(requestedStep, 0, stepCount - 1)
    const saved = readTutorialProgress(id) || initialTutorialProgress[id]
    return saved?.completedAt ? 0 : clamp(saved?.stepIndex || 0, 0, stepCount - 1)
  }, [initialTutorialProgress, searchParams])

  React.useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  React.useEffect(() => {
    if (!required) {
      initializedRequiredTour.current = false
      return
    }
    if (initializedRequiredTour.current) return
    initializedRequiredTour.current = true
    setTutorialId('navigation')
    setStepIndex(getResumeStep('navigation', getGuidedTutorial('navigation')!.steps.length))
    const recovering = searchParams.get('tourRecovered') === 'missing-project'
    setOpen(recovering)
    setWelcomeOpen(!recovering)
  }, [getResumeStep, required, searchParams])

  React.useEffect(() => {
    const recovering = required && searchParams.get('tourRecovered') === 'missing-project'
    const newRecoveryRequest = recovering && !previousRecoveryRequest.current
    previousRecoveryRequest.current = recovering
    if (!newRecoveryRequest) return
    setTutorialId('navigation')
    setStepIndex(getResumeStep('navigation', getGuidedTutorial('navigation')!.steps.length))
    setWelcomeOpen(false)
    setOpen(true)
  }, [getResumeStep, required, searchParams])

  React.useEffect(() => {
    if (isUsableTutorialProjectId(defaultProjectId)) setActiveProjectId(defaultProjectId)
  }, [defaultProjectId])

  React.useEffect(() => {
    const projectCreated = (event: Event) => {
      const id = (event as CustomEvent<{ project?: { id?: string } }>).detail?.project?.id
      if (isUsableTutorialProjectId(id)) setActiveProjectId(id)
    }
    window.addEventListener('feedbacks:project-created', projectCreated)
    return () => window.removeEventListener('feedbacks:project-created', projectCreated)
  }, [])

  React.useEffect(() => {
    if (required) return
    const newNavigationTourRequest = navigationTourRequested && !previousNavigationTourRequest.current
    previousNavigationTourRequest.current = navigationTourRequested
    setWelcomeOpen(false)
    const requestedTutorial = getGuidedTutorial(requestedTutorialId)
    if (requestedTutorial) {
      handledStandardInitialOffer.current = true
      setTutorialId(requestedTutorial.id)
      setStepIndex(getResumeStep(requestedTutorial.id, requestedTutorial.steps.length))
      setOpen(true)
    } else if (newNavigationTourRequest || (initialOpen && !handledStandardInitialOffer.current)) {
      handledStandardInitialOffer.current = true
      setTutorialId('navigation')
      setStepIndex(getResumeStep('navigation', getGuidedTutorial('navigation')!.steps.length))
      setOpen(false)
      setWelcomeOpen(true)
    }
  }, [getResumeStep, initialOpen, initialTutorialProgress, navigationTourRequested, requestedTutorialId, required])

  React.useEffect(() => {
    const startTour = () => {
      setTutorialId('navigation')
      setStepIndex(getResumeStep('navigation', getGuidedTutorial('navigation')!.steps.length))
      if (required) setWelcomeOpen(true)
      else {
        setOpen(false)
        setWelcomeOpen(true)
      }
    }
    window.addEventListener('feedbacks:start-product-tour', startTour)
    return () => window.removeEventListener('feedbacks:start-product-tour', startTour)
  }, [getResumeStep, required])

  React.useEffect(() => {
    if (!open || demoMode) return
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
  }, [activeStep.href, demoMode, open, pathname, pendingStepIndex, router, searchParams, steps])

  React.useEffect(() => {
    if (!open) return
    window.dispatchEvent(new CustomEvent(
      isSidebarTourTarget(activeStep.target)
        ? 'feedbacks:expand-sidebar'
        : 'feedbacks:close-mobile-sidebar',
    ))

    let frame = 0
    const measureSpotlight = () => {
      frame = window.requestAnimationFrame(() => {
        setSpotlight(getSpotlightRect(activeStep.target, demoMode))
      })
    }
    const focusTarget = () => {
      const target = getTourTarget(activeStep.target, demoMode)
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
  }, [activeStep.target, demoMode, open, pathname, searchParams])

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
    setPendingStepIndex(null)
  }, [pathname, pendingStepIndex, searchParams, steps])

  const closeTour = React.useCallback((returnToDashboard = false, completionConfirmed = false) => {
    if (required && !completionConfirmed) return
    setOpen(false)
    setSpotlight(null)
    if (returnToDashboard) {
      router.replace('/dashboard')
      return
    }
    if (pathname === '/dashboard' && searchParams.get('tour') === '1') {
      router.replace('/dashboard')
    }
  }, [pathname, required, router, searchParams])

  const goToStep = (nextIndex: number) => {
    const safeIndex = clamp(nextIndex, 0, steps.length - 1)
    const nextStep = steps[safeIndex]
    saveTutorialProgress(tutorialId, { stepIndex: safeIndex })
    if (demoMode) {
      setStepIndex(safeIndex)
      setSpotlight(null)
      return
    }
    if (!isCurrentHref(pathname, searchParams, nextStep.href)) {
      setPendingStepIndex(safeIndex)
      router.push(nextStep.href)
      return
    }
    setStepIndex(safeIndex)
  }

  const skipTour = async () => {
    if (required) return
    try {
      if (tutorialId === 'navigation') await savePreference('productTourDismissedAt')
      else saveTutorialProgress(tutorialId, { stepIndex, dismissedAt: new Date().toISOString() })
      toast({ title: tutorialId === 'navigation' ? 'Tour hidden for now' : 'Tutorial saved for later' })
      setWelcomeOpen(false)
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
        saveTutorialProgress(tutorialId, { stepIndex: steps.length - 1, completedAt: new Date().toISOString() })
        const programmeResponse = required
          ? await fetch('/api/early-adopter/onboarding', { method: 'POST' })
          : null
        const programme = programmeResponse
          ? await programmeResponse.json().catch(() => null) as { error?: string; granted?: boolean; reason?: string; complimentaryProUntil?: string } | null
          : null
        if (required && programme?.reason === 'capacity_full') {
          toast({
            title: 'All 100 programme places have been claimed',
            description: 'Your product tour is complete, but no programme place or complimentary Pro was activated.',
            variant: 'destructive',
          })
          closeTour(true, true)
          router.refresh()
          return
        }
        if (required && (!programmeResponse?.ok || (!programme?.granted && programme?.reason !== 'already_completed'))) {
          throw new Error('Pro could not be activated yet. Your guided onboarding will stay open so you can retry.')
        }
        if (required || programme?.granted) router.refresh()
        toast({ title: required || programme?.granted ? 'Onboarding complete. Pro is active.' : 'Product tour complete' })
        closeTour(true, true)
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

  if (welcomeOpen) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
          aria-describedby="onboarding-welcome-description"
          className="relative w-full max-w-[520px] overflow-hidden rounded-xl border bg-card p-6 shadow-[0_30px_90px_rgb(0_0_0/0.38)] sm:p-8"
        >
          <MascotSpotlight variant="tour" className="pointer-events-none absolute -right-5 -top-5 h-36 w-36 sm:h-44 sm:w-44" sizes="176px" priority />
          <div className="relative max-w-[350px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.08] shadow-sm" aria-hidden="true">
              <Sparkles className="h-6 w-6 text-primary" />
            </span>
            <h1 id="onboarding-welcome-title" className="mt-6 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
              {required ? 'Complete the guided tour to unlock Pro.' : 'Learn feedbacks.dev with a guided tour.'}
            </h1>
            <p id="onboarding-welcome-description" className="mt-3 text-base leading-7 text-muted-foreground">
              {required
                ? 'Explore every core screen in a fast practice workspace with realistic sample data. No project is required, nothing is saved, and Pro activates when you finish the last step.'
                : 'Explore every core screen in a fast practice workspace with realistic sample data. No project is required, and the tour never changes your saved settings.'}
            </p>
          </div>
          <div className="relative mt-7 border-t pt-5">
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              {required
                ? 'This guided onboarding is required for the Early Adopter Programme and cannot be skipped.'
                : 'Take it now or come back later from Product tour in the account menu.'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              {!required ? (
                <Button variant="ghost" size="lg" className="h-12" onClick={() => void skipTour()} disabled={saving}>
                  Not now
                </Button>
              ) : null}
              <Button
                size="lg"
                className="h-12 w-full gap-2 sm:w-auto"
                onClick={() => {
                  setWelcomeOpen(false)
                  setTutorialId('navigation')
                  setOpen(true)
                }}
                autoFocus
              >
                {stepIndex > 0 ? 'Continue guided tour' : required ? 'Begin guided tour' : 'Start product tour'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!open) return null

  const isSidebarStep = isSidebarTourTarget(activeStep.target)
  const panelPosition = getTourPanelPosition({
    spotlight,
    panel: panelSize,
    viewport,
    sidebarStep: isSidebarStep,
  })
  const finalStep = stepIndex === steps.length - 1
  const tourMascotVariant = getTourMascotVariant(activeStep.target)
  const waitingForProject = activeStep.waitingForProject

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {demoMode ? <ProductTourDemo activeTarget={activeStep.target} /> : null}
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
        className="pointer-events-auto fixed flex max-h-[320px] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-[0_24px_70px_rgb(0_0_0/0.32)] sm:block sm:max-h-none sm:p-6"
        style={{ top: panelPosition.top, left: panelPosition.left }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="product-tour-title" className="text-lg font-semibold leading-6">
              {activeStep.title}
            </h2>
            <p className="mt-1 text-xs font-semibold text-primary">
              Step {stepIndex + 1} of {steps.length} · {tutorial.title}
            </p>
          </div>
          <div className="-my-3 flex shrink-0 items-start gap-1">
            <MascotSpotlight key={tourMascotVariant} variant={tourMascotVariant} className="h-16 w-16" sizes="64px" />
            {!required ? <button
              type="button"
              onClick={() => void skipTour()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Skip tour"
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </button> : null}
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto pr-1 sm:overflow-visible sm:pr-0">
          <p id="product-tour-description" className="mt-3 text-[14px] leading-5 text-muted-foreground sm:text-[15px] sm:leading-6">
            {activeStep.body}
          </p>
          {activeStep.tip ? (
            <div className="mt-3 flex gap-2.5 rounded-lg border border-primary/20 bg-primary/[0.06] p-2.5 text-[13px] leading-[18px] sm:mt-4 sm:p-3 sm:text-sm sm:leading-5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p><span className="font-semibold text-foreground">Pro tip:</span> <span className="text-muted-foreground">{activeStep.tip}</span></p>
            </div>
          ) : null}
          {required && stepIndex === 0 ? (
            <p className="mt-3 rounded-md border border-primary/25 bg-primary/[0.05] px-3 py-2 text-sm font-medium text-foreground">
              Complete every step of this guided onboarding. Pro activates at the end.
            </p>
          ) : null}
          {!spotlight && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Opening the right section now. You can always use Back to return to the previous working step.
            </p>
          )}
        </div>
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
            {!required ? (
              <Button variant="outline" size="sm" className="h-8" onClick={() => void skipTour()} disabled={saving || pendingStepIndex !== null}>
                Skip
              </Button>
            ) : null}
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                if (finalStep) void finishTour()
                else goToStep(stepIndex + 1)
              }}
              disabled={saving || pendingStepIndex !== null || waitingForProject}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : finalStep ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              {waitingForProject ? 'Create project to continue' : finalStep ? (required ? 'Finish and activate Pro' : 'Finish') : 'Next'}
            </Button>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
