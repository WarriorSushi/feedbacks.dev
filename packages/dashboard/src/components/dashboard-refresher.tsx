'use client'

import * as React from 'react'
import Link from 'next/link'
import { CircleHelp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const REFRESHER_HIDDEN_UNTIL_KEY = 'feedbacks:dashboard:refresher-hidden-until'
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

export function DashboardRefresher() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const hiddenUntil = Number(window.localStorage.getItem(REFRESHER_HIDDEN_UNTIL_KEY) || 0)
    setVisible(hiddenUntil <= Date.now())
  }, [])

  if (!visible) return null

  const dismiss = () => {
    window.localStorage.setItem(REFRESHER_HIDDEN_UNTIL_KEY, String(Date.now() + TWO_WEEKS_MS))
    setVisible(false)
  }

  return (
    <div data-tour="dashboard-capabilities" className="flex flex-col gap-2 border-y px-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <CircleHelp className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">Need a refresher?</span>
        <span className="hidden truncate text-muted-foreground md:inline">Check the one activation path, then continue where you left off.</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button asChild size="sm" variant="ghost" className="h-8 px-2.5 text-xs">
          <Link href="/tutorials">Setup checklist</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs">
          <Link href="/dashboard?tour=1">Navigation tour</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={dismiss}
          aria-label="Hide this reminder for two weeks"
          title="Hide for two weeks"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
