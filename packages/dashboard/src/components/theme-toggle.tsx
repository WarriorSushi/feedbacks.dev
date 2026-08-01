'use client'

import * as React from 'react'
import { flushSync } from 'react-dom'
import { Laptop, Moon, Palette, Sun } from 'lucide-react'
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
  className?: string
  landing?: boolean
}

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'windows98', label: 'Windows 98', shortLabel: '98', icon: Palette },
  { value: 'system', label: 'Device', icon: Laptop },
] as const

function getMaxRadius(x: number, y: number) {
  // Add a small overscan so scrollbar gutters, fractional device pixels, and
  // screenshot viewports cannot leave an unrevealed corner sliver.
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  ) + 96
}

export function ThemeToggle({ collapsed = false, className, landing = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (theme || resolvedTheme || 'light') : 'light'
  const selectedTheme = currentTheme === 'system' ? (resolvedTheme || 'light') : currentTheme
  const currentIndex = Math.max(
    0,
    APPEARANCE_OPTIONS.findIndex((option) => option.value === currentTheme),
  )
  const currentOption = APPEARANCE_OPTIONS[currentIndex]
  const nextOption = APPEARANCE_OPTIONS[(currentIndex + 1) % APPEARANCE_OPTIONS.length]

  const changeTheme = async (
    nextTheme: (typeof APPEARANCE_OPTIONS)[number]['value'],
    target: HTMLElement,
  ) => {
    if (nextTheme === currentTheme) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const viewTransitionDocument = document as ViewTransitionDocument

    if (!viewTransitionDocument.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme)
      return
    }

    const rect = target.getBoundingClientRect()
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
        duration: nextTheme === 'windows98' ? 260 : 520,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  if (landing) {
    const landingOptions = APPEARANCE_OPTIONS.filter((option) => option.value !== 'system')

    return (
      <div
        role="radiogroup"
        aria-label="Landing page appearance"
        className={cn(
          'landing-theme-toggle inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border/80 bg-background/70 p-1 shadow-sm',
          className,
        )}
      >
        {landingOptions.map((option) => {
          const Icon = option.icon
          const selected = selectedTheme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${option.label} appearance`}
              title={option.label}
              onClick={(event) => void changeTheme(option.value, event.currentTarget)}
              className={cn(
                'landing-theme-option relative flex h-8 min-w-8 items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 text-[11px] font-semibold text-muted-foreground transition-colors',
                selected ? 'bg-card text-foreground shadow-sm' : 'hover:bg-accent hover:text-accent-foreground',
                option.value === 'windows98' && 'landing-theme-option-98',
              )}
            >
              <Icon className="relative z-[1] h-3.5 w-3.5 shrink-0" />
              <span className="relative z-[1] hidden xl:inline">
                {option.value === 'windows98' ? '98' : option.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (collapsed) {
    const CurrentIcon = currentOption.icon

    return (
      <button
        type="button"
        aria-label={`Appearance: ${currentOption.label}. Switch to ${nextOption.label}`}
        title={`${currentOption.label}. Switch to ${nextOption.label}`}
        onClick={(event) => void changeTheme(nextOption.value, event.currentTarget)}
        className={cn(
          'flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground',
          className,
        )}
      >
        <CurrentIcon className="h-[17px] w-[17px]" />
      </button>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between px-1 text-[11px] font-medium text-muted-foreground">
        <span>Appearance</span>
        <span aria-live="polite">{currentOption.label}</span>
      </div>
      <div
        role="radiogroup"
        aria-label="Appearance"
        className="grid grid-cols-4 gap-1.5 rounded-lg border border-border/90 bg-surface-raised p-1.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.8),0_1px_3px_hsl(var(--foreground)/0.12)]"
      >
        {APPEARANCE_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = currentTheme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              onClick={(event) => void changeTheme(option.value, event.currentTarget)}
              className={cn(
                'flex h-9 min-w-0 items-center justify-center gap-1 rounded-md border border-transparent text-[11px] font-semibold transition-colors',
                selected
                  ? 'border-border/80 bg-card text-foreground shadow-[0_1px_3px_hsl(var(--foreground)/0.18)]'
                  : 'text-muted-foreground hover:border-border/60 hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {'shortLabel' in option && option.shortLabel ? <span>{option.shortLabel}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
