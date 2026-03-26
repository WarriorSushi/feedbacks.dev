'use client'

import * as React from 'react'
import {
  buildRuntimeWidgetConfig,
  buildWidgetScriptUrl,
  type SavedWidgetConfig,
  type WidgetConfig,
} from '@feedbacks/shared'
import { cn } from '@/lib/utils'

interface WidgetPreviewSurfaceProps {
  appOrigin: string
  projectKey: string
  config: SavedWidgetConfig
  className?: string
  onStatusChange?: (status: 'loading' | 'ready' | 'error', error?: string | null) => void
}

type WidgetInstance = {
  destroy?: () => void
}

type WidgetRuntimeCtor = new (config: WidgetConfig) => WidgetInstance
type WidgetRuntimeModule = {
  FeedbacksWidget?: WidgetRuntimeCtor
  default?: WidgetRuntimeCtor
}

type WidgetRuntimeWindow = Window & {
  FeedbacksWidget?: WidgetRuntimeCtor | WidgetRuntimeModule
}

const runtimeLoaders = new Map<string, Promise<WidgetRuntimeCtor>>()
const RUNTIME_WAIT_TIMEOUT_MS = 8_000

function resolveRuntimeCtor(runtime: WidgetRuntimeWindow['FeedbacksWidget']): WidgetRuntimeCtor | null {
  if (typeof runtime === 'function') {
    return runtime
  }

  if (runtime && typeof runtime === 'object') {
    if (typeof runtime.FeedbacksWidget === 'function') {
      return runtime.FeedbacksWidget
    }

    if (typeof runtime.default === 'function') {
      return runtime.default
    }
  }

  return null
}

function waitForRuntime(src: string): Promise<WidgetRuntimeCtor> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const poll = () => {
      const runtimeWindow = window as WidgetRuntimeWindow
      const ctor = resolveRuntimeCtor(runtimeWindow.FeedbacksWidget)
      if (ctor) {
        resolve(ctor)
        return
      }

      if (Date.now() - startedAt >= RUNTIME_WAIT_TIMEOUT_MS) {
        reject(new Error(`Widget runtime did not initialize correctly from ${src}`))
        return
      }

      window.setTimeout(poll, 50)
    }

    poll()
  })
}

function loadWidgetRuntime(appOrigin: string): Promise<WidgetRuntimeCtor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Widget runtime can only load in the browser'))
  }

  const runtimeWindow = window as WidgetRuntimeWindow
  const existingCtor = resolveRuntimeCtor(runtimeWindow.FeedbacksWidget)
  if (existingCtor) {
    return Promise.resolve(existingCtor)
  }

  const src = buildWidgetScriptUrl(appOrigin)
  const cached = runtimeLoaders.get(src)
  if (cached) return cached

  const promise = new Promise<WidgetRuntimeCtor>((resolve, reject) => {
    const resolveRuntime = () => {
      void waitForRuntime(src).then(resolve).catch(reject)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existingScript) {
      if (existingScript.dataset.feedbacksLoaded === 'true') {
        resolveRuntime()
        return
      }

      const handleLoad = () => {
        existingScript.dataset.feedbacksLoaded = 'true'
        resolveRuntime()
      }
      const handleError = () => reject(new Error(`Failed to load widget runtime from ${src}`))

      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener('error', handleError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.dataset.feedbacksWidgetRuntime = 'true'
    script.onload = () => {
      script.dataset.feedbacksLoaded = 'true'
      resolveRuntime()
    }
    script.onerror = () => reject(new Error(`Failed to load widget runtime from ${src}`))
    document.head.appendChild(script)
  }).finally(() => {
    runtimeLoaders.delete(src)
  })

  runtimeLoaders.set(src, promise)
  return promise
}

export function WidgetPreviewSurface({
  appOrigin,
  projectKey,
  config,
  className,
  onStatusChange,
}: WidgetPreviewSurfaceProps) {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const statusChangeRef = React.useRef(onStatusChange)
  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey, config, { appOrigin }),
    [appOrigin, config, projectKey],
  )

  React.useEffect(() => {
    statusChangeRef.current = onStatusChange
  }, [onStatusChange])

  React.useEffect(() => {
    let cancelled = false
    let instance: WidgetInstance | null = null
    const host = hostRef.current

    if (!host) return undefined

    host.innerHTML = ''

    const content = document.createElement('div')
    content.className = 'max-w-lg space-y-2'
    content.innerHTML = `
      <p class="text-sm font-medium text-foreground">Preview surface</p>
      <p class="text-sm text-muted-foreground">
        Inline and trigger modes render inside this box. Modal mode still uses its floating launcher.
      </p>
    `
    host.appendChild(content)

    if (runtimeConfig.embedMode === 'inline' && runtimeConfig.target) {
      const mount = document.createElement('div')
      mount.id = runtimeConfig.target.replace(/^#/, '')
      mount.className = 'mt-6'
      host.appendChild(mount)
    }

    if (runtimeConfig.embedMode === 'trigger' && runtimeConfig.target) {
      const trigger = document.createElement('button')
      trigger.id = runtimeConfig.target.replace(/^#/, '')
      trigger.type = 'button'
      trigger.textContent = runtimeConfig.buttonText || 'Feedback'
      trigger.className = 'mt-6 inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-accent'
      host.appendChild(trigger)
    }

    statusChangeRef.current?.('loading', null)

    void loadWidgetRuntime(appOrigin)
      .then((RuntimeCtor) => {
        if (cancelled) return
        instance = new RuntimeCtor(runtimeConfig)
        statusChangeRef.current?.('ready', null)
      })
      .catch((runtimeError) => {
        console.error('[WidgetPreviewSurface] Failed to initialize widget', runtimeError)
        if (!cancelled) {
          statusChangeRef.current?.(
            'error',
            runtimeError instanceof Error ? runtimeError.message : 'Failed to initialize widget',
          )
        }
      })

    return () => {
      cancelled = true
      instance?.destroy?.()
      host.innerHTML = ''
    }
  }, [appOrigin, runtimeConfig])

  return (
    <div
      ref={hostRef}
      className={cn(
        'relative min-h-[280px] rounded-xl border bg-background p-6',
        className,
      )}
    />
  )
}
