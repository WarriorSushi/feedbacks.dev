'use client'

import * as React from 'react'
import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [bottomClearance, setBottomClearance] = React.useState(16)

  React.useEffect(() => {
    let frame = 0
    let resizeObserver: ResizeObserver | null = null

    const measure = () => {
      frame = 0
      const viewportHeight = window.innerHeight
      let nextClearance = 16
      document.querySelectorAll<HTMLElement>('[data-toast-clearance]').forEach((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= viewportHeight) return
        nextClearance = Math.max(nextClearance, viewportHeight - rect.top + 12)
      })
      setBottomClearance((current) => current === nextClearance ? current : nextClearance)
    }

    const observeClearanceElements = () => {
      resizeObserver?.disconnect()
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(measure)
      })
      document.querySelectorAll<HTMLElement>('[data-toast-clearance]').forEach((element) => {
        resizeObserver?.observe(element)
      })
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    const mutationObserver = new MutationObserver(observeClearanceElements)
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-toast-clearance'],
      childList: true,
      subtree: true,
    })
    window.addEventListener('resize', observeClearanceElements)
    observeClearanceElements()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', observeClearanceElements)
    }
  }, [])

  return (
    <div
      data-toast-viewport
      className="fixed inset-x-4 z-[60] flex flex-col items-end gap-2 transition-[bottom] duration-200 sm:left-auto sm:right-4 sm:max-w-sm"
      style={{ bottom: `max(${bottomClearance}px, env(safe-area-inset-bottom, 0px))` }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-toast-in w-full rounded-xl border px-4 py-3 shadow-[var(--shadow-float)] backdrop-blur-xl',
            t.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : 'border bg-background text-foreground'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-sm opacity-80 mt-1">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 opacity-50 transition-[opacity,transform] duration-200 hover:rotate-6 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
