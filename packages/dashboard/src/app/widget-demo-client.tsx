'use client'

import * as React from 'react'
import { Bug, Lightbulb, Star, MessageSquare } from 'lucide-react'
import type { CategoryType } from './landing-types'

const DEMOS: {
  type: CategoryType
  label: string
  Icon: typeof Bug
  text: string
  activeClass: string
}[] = [
  {
    type: 'bug',
    label: 'Bug',
    Icon: Bug,
    text: 'CSV export crashes on datasets over 1 000 rows.',
    activeClass:
      'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400',
  },
  {
    type: 'idea',
    label: 'Idea',
    Icon: Lightbulb,
    text: 'Keyboard shortcuts for the dashboard would be huge.',
    activeClass:
      'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  },
  {
    type: 'praise',
    label: 'Praise',
    Icon: Star,
    text: 'The new search is blazing fast. Really great work!',
    activeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
]

export function WidgetDemo() {
  const [active, setActive] = React.useState(0)
  const [fading, setFading] = React.useState(false)

  React.useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      const swapId = setTimeout(() => {
        setActive((prev) => (prev + 1) % DEMOS.length)
        setFading(false)
      }, 220)
      return () => clearTimeout(swapId)
    }, 3400)
    return () => clearInterval(id)
  }, [])

  const demo = DEMOS[active]

  return (
    <div className="w-72 overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-black/10 sm:w-80">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Send Feedback</span>
        </div>
        <button className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          ✕
        </button>
      </div>

      <div className="flex gap-1.5 px-4 pt-3">
        {DEMOS.map((d, i) => {
          const DIcon = d.Icon
          const isActive = i === active
          return (
            <button
              key={d.type}
              onClick={() => {
                setFading(true)
                setTimeout(() => {
                  setActive(i)
                  setFading(false)
                }, 180)
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive ? d.activeClass : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DIcon className="h-3.5 w-3.5" />
              {d.label}
            </button>
          )
        })}
      </div>

      <div className="px-4 pb-4 pt-3">
        <div
          className="min-h-[56px] rounded-lg border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-foreground/70 transition-opacity duration-200"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {demo.text}
        </div>
        <div
          className="mt-3 flex items-center justify-between transition-opacity duration-200"
          style={{ opacity: fading ? 0 : 1 }}
        >
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <demo.Icon className="h-3.5 w-3.5" />
            {demo.label} report
          </span>
          <button className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80">
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b bg-background/95 backdrop-blur-sm' : ''
      }`}
    >
      {children}
    </header>
  )
}
