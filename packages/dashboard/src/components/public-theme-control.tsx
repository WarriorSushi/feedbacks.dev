'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

const DASHBOARD_ROUTES = [
  '/api-docs',
  '/billing',
  '/dashboard',
  '/feedback',
  '/integrations',
  '/invites',
  '/project-required',
  '/projects',
  '/settings',
  '/tutorials',
  '/updates',
]

export function PublicThemeControl() {
  const pathname = usePathname()
  const hasLandingAppearanceControl = pathname === '/'
  const hasDashboardAppearanceControl = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (hasLandingAppearanceControl || hasDashboardAppearanceControl) return null

  if (pathname === '/auth') {
    return (
      <div className="auth-theme-control fixed right-5 top-5 z-[70] sm:right-8 sm:top-8">
        <ThemeToggle landing />
      </div>
    )
  }

  return (
    <div className="public-theme-control fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[70] w-11 rounded-lg border bg-popover p-1 shadow-[var(--shadow-float)]">
      <ThemeToggle collapsed />
    </div>
  )
}
