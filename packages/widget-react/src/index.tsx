import * as React from 'react'
import {
  buildRuntimeWidgetConfig,
  buildWidgetScriptUrl,
  type SavedWidgetConfig,
  type WidgetConfig,
} from '@feedbacks/shared'

type WidgetInstance = {
  destroy?: () => void
}

type WidgetRuntimeModule = {
  FeedbacksWidget?: new (config: WidgetConfig) => WidgetInstance
  default?: new (config: WidgetConfig) => WidgetInstance
}

type WidgetRuntimeWindow = Window & {
  FeedbacksWidget?: (new (config: WidgetConfig) => WidgetInstance) | WidgetRuntimeModule
}

export interface FeedbacksWidgetProps extends SavedWidgetConfig {
  appOrigin?: string
  projectKey: string
  className?: string
  id?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const runtimeLoaders = new Map<string, Promise<void>>()

function resolveRuntimeCtor(runtime: WidgetRuntimeWindow['FeedbacksWidget']) {
  if (typeof runtime === 'function') return runtime
  if (runtime && typeof runtime === 'object') {
    if (typeof runtime.FeedbacksWidget === 'function') return runtime.FeedbacksWidget
    if (typeof runtime.default === 'function') return runtime.default
  }

  return null
}

function loadWidgetRuntime(appOrigin?: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const runtimeWindow = window as WidgetRuntimeWindow
  if (resolveRuntimeCtor(runtimeWindow.FeedbacksWidget)) return Promise.resolve()

  const src = buildWidgetScriptUrl(appOrigin)
  const cached = runtimeLoaders.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existingScript) {
      if (existingScript.dataset.feedbacksLoaded === 'true') {
        resolve()
        return
      }

      const handleLoad = () => {
        existingScript.dataset.feedbacksLoaded = 'true'
        resolve()
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
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load widget runtime from ${src}`))
    document.head.appendChild(script)
  }).finally(() => {
    runtimeLoaders.delete(src)
  })

  runtimeLoaders.set(src, promise)
  return promise
}

function sanitizeTargetSelector(target?: string): string | undefined {
  if (!target) return undefined
  const trimmed = target.trim()
  if (!trimmed) return undefined
  return trimmed.startsWith('#') || trimmed.startsWith('.') ? trimmed : `#${trimmed}`
}

export function FeedbacksWidget(props: FeedbacksWidgetProps) {
  const {
    appOrigin,
    projectKey,
    embedMode = 'modal',
    position,
    target,
    buttonText,
    primaryColor,
    backgroundColor,
    scale,
    modalWidth,
    apiUrl,
    debug,
    requireEmail,
    enableType,
    enableRating,
    enableScreenshot,
    screenshotRequired,
    enableAttachment,
    attachmentMaxMB,
    allowedAttachmentMimes,
    requireCaptcha,
    captchaProvider,
    turnstileSiteKey,
    hcaptchaSiteKey,
    formTitle,
    formSubtitle,
    messageLabel,
    messagePlaceholder,
    emailLabel,
    submitButtonText,
    cancelButtonText,
    successTitle,
    successDescription,
    openOnKey,
    openAfterMs,
    className,
    id,
    style,
    children,
  } = props

  const instanceRef = React.useRef<WidgetInstance | null>(null)
  const autoTargetId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const renderedTargetId = !target && embedMode !== 'modal'
    ? `feedbacks-widget-${autoTargetId}`
    : undefined
  const resolvedTarget = sanitizeTargetSelector(target)
    ?? (renderedTargetId ? `#${renderedTargetId}` : undefined)
  const savedConfig: SavedWidgetConfig = {
    apiUrl,
    embedMode,
    position,
    target: resolvedTarget,
    buttonText,
    primaryColor,
    backgroundColor,
    scale,
    modalWidth,
    debug,
    requireEmail,
    enableType,
    enableRating,
    enableScreenshot,
    screenshotRequired,
    enableAttachment,
    attachmentMaxMB,
    allowedAttachmentMimes,
    requireCaptcha,
    captchaProvider,
    turnstileSiteKey,
    hcaptchaSiteKey,
    formTitle,
    formSubtitle,
    messageLabel,
    messagePlaceholder,
    emailLabel,
    submitButtonText,
    cancelButtonText,
    successTitle,
    successDescription,
    openOnKey,
    openAfterMs,
  }
  const runtimeConfig = buildRuntimeWidgetConfig(projectKey, savedConfig, {
    appOrigin,
    apiUrl,
  })

  const configKey = JSON.stringify(runtimeConfig)

  React.useEffect(() => {
    let cancelled = false
    instanceRef.current?.destroy?.()
    instanceRef.current = null

    loadWidgetRuntime(appOrigin)
      .then(() => {
        if (cancelled) return
        const runtimeWindow = window as WidgetRuntimeWindow
        const RuntimeCtor = resolveRuntimeCtor(runtimeWindow.FeedbacksWidget)
        if (!RuntimeCtor) throw new Error('Feedbacks widget runtime did not initialize correctly')
        instanceRef.current = new RuntimeCtor(runtimeConfig)
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('[FeedbacksWidget] Unable to load runtime', error)
        }
      })

    return () => {
      cancelled = true
      instanceRef.current?.destroy?.()
      instanceRef.current = null
    }
  }, [appOrigin, configKey])

  if (embedMode === 'modal') {
    return null
  }

  if (!renderedTargetId) {
    return null
  }

  if (embedMode === 'inline') {
    return React.createElement('div', {
      id: id || renderedTargetId,
      className,
      style,
    })
  }

  return React.createElement(
    'button',
    {
      id: id || renderedTargetId,
      className,
      style,
      type: 'button',
    },
    children ?? buttonText ?? 'Feedback'
  )
}

export default FeedbacksWidget
