'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  MessageSquare,
  FolderOpen,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { Project } from '@/lib/types'
import { createClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  user: { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } }
  projects: Project[]
  currentProjectId?: string
}

export function Sidebar({ user, projects, currentProjectId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [projectOpen, setProjectOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const supabase = React.useMemo(() => createClient(), [])

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Link href="/dashboard" className="text-lg font-bold">
          feedbacks<span className="text-primary">.dev</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="text-lg font-bold">
            feedbacks<span className="text-primary">.dev</span>
          </Link>
        </div>

        {/* Project Switcher */}
        {projects.length > 0 && (
          <div className="border-b p-3">
            <div className="relative">
              <button
                onClick={() => setProjectOpen(!projectOpen)}
                className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
              >
                <span className="truncate">{currentProject?.name || 'Select project'}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
              {projectOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-popover shadow-md">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      onClick={() => {
                        setProjectOpen(false)
                        setMobileOpen(false)
                      }}
                      className={cn(
                        'block px-3 py-2 text-sm hover:bg-accent',
                        p.id === currentProjectId && 'bg-accent'
                      )}
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <div className="flex items-center gap-2 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate text-sm">{displayName}</div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
