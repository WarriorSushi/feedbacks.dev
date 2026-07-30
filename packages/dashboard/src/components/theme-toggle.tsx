'use client'

import * as React from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

type ViewTransition = {
  ready: Promise<void>
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition
}

interface ThemeToggleProps {
  collapsed?: boolean
}

function getMaxRadius(x: number, y: number) {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  const toggleTheme = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const viewTransitionDocument = document as ViewTransitionDocument

    if (!viewTransitionDocument.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const maxRadius = getMaxRadius(x, y)

    const transition = viewTransitionDocument.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    await transition.ready

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 520,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Use light appearance' : 'Use dark appearance'}
      title={collapsed ? (isDark ? 'Use light appearance' : 'Use dark appearance') : undefined}
      onClick={toggleTheme}
      className={cn(
        'group flex w-full items-center rounded-lg text-[13px] font-medium',
        'text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        collapsed ? 'justify-center px-2 py-2' : 'justify-between gap-3 px-3 py-2',
      )}
    >
      <span className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2.5')}>
        {isDark ? (
          <Moon className="h-[17px] w-[17px] shrink-0" />
        ) : (
          <Sun className="h-[17px] w-[17px] shrink-0" />
        )}
        {!collapsed && <span>Appearance</span>}
      </span>

      {!collapsed && <span className="text-[11px] font-medium text-muted-foreground">{isDark ? 'Dark' : 'Light'}</span>}
    </button>
  )
}
