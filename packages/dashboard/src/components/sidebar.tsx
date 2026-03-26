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
  ChevronUp,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Check,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { Project } from '@/lib/types'
import { createClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feedback',  label: 'Feedback',  icon: MessageSquare },
  { href: '/projects',  label: 'Projects',  icon: FolderOpen },
  { href: '/settings',  label: 'Settings',  icon: Settings },
]

const projectColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-blue-500',
]

interface SidebarProps {
  user: { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } }
  projects: Project[]
  currentProjectId?: string
  boardSlugs?: Record<string, string>
}

export function Sidebar({ user, projects, currentProjectId, boardSlugs = {} }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [projectOpen, setProjectOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const supabase = React.useMemo(() => createClient(), [])

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectOpen(false)
      }
    }
    if (projectOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [projectOpen])

  // Close mobile nav on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const currentProjectColorClass =
    projectColors[projects.indexOf(currentProject!) % projectColors.length] ?? 'bg-muted-foreground'

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link href="/dashboard" className="text-[17px] font-semibold tracking-tight">
          feedbacks<span className="text-primary">.dev</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </Button>
      </div>

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-card',
          'transition-[width,transform] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]',
          'md:static md:h-full md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[60px]' : 'w-60'
        )}
      >
        {/* Logo row */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
          <div
            className={cn(
              'overflow-hidden transition-[width,opacity] duration-200',
              collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
            )}
          >
            <Link
              href="/dashboard"
              className="whitespace-nowrap text-[17px] font-semibold tracking-tight"
              tabIndex={collapsed ? -1 : 0}
            >
              feedbacks<span className="text-primary">.dev</span>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Project switcher */}
        {projects.length > 0 && !collapsed && (
          <div className="shrink-0 border-b p-2.5" ref={dropdownRef}>
            <button
              onClick={() => setProjectOpen(!projectOpen)}
              className={cn(
                'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px]',
                'border border-border/60 bg-background/60',
                'transition-all duration-150 hover:border-border hover:bg-accent',
                projectOpen && 'border-primary/30 bg-accent'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', currentProjectColorClass)} />
                <span className="truncate font-medium">
                  {currentProject?.name ?? 'Select project'}
                </span>
              </span>
              {projectOpen ? (
                <ChevronUp className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* Dropdown */}
            <div
              className={cn(
                'overflow-hidden transition-[grid-template-rows] duration-200 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]',
                projectOpen ? 'grid grid-rows-[1fr]' : 'grid grid-rows-[0fr]'
              )}
            >
              <div className="min-h-0">
                <div className="mt-1 overflow-hidden rounded-lg border border-border/80 bg-popover shadow-md shadow-black/5">
                  {projects.map((p, i) => {
                    const isSelected = p.id === currentProjectId
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        onClick={() => setProjectOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 text-[13px]',
                          'transition-colors duration-100 hover:bg-accent',
                          isSelected && 'bg-accent/60'
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'h-2 w-2 shrink-0 rounded-full',
                              projectColors[i % projectColors.length]
                            )}
                          />
                          <span className={cn('truncate', isSelected && 'font-medium')}>
                            {p.name}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable middle section: nav + public boards */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Nav items */}
          <nav className="space-y-0.5 p-2.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium',
                    'transition-all duration-150',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive
                      ? [
                          'bg-primary/8 text-primary',
                          // Left border glow indicator
                          'before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-r-full',
                          'before:bg-primary before:shadow-[0_0_8px_hsl(var(--primary)/0.5)]',
                        ]
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[17px] w-[17px] shrink-0 transition-transform duration-150',
                      !isActive && 'group-hover:scale-[1.08]',
                      isActive && 'text-primary'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Public Board link */}
          {(() => {
            const projectsWithBoards = projects.filter((p) => boardSlugs[p.id])
            if (projectsWithBoards.length === 0 || collapsed) return null

            if (projectsWithBoards.length === 1) {
              const slug = boardSlugs[projectsWithBoards[0].id]
              return (
                <div className="px-2.5 pb-2">
                  <a
                    href={`/p/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
                  >
                    <Globe className="h-[17px] w-[17px] shrink-0 transition-transform duration-150 group-hover:scale-[1.08]" />
                    <span className="truncate">Public Board</span>
                    <ExternalLink className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                  </a>
                </div>
              )
            }

            return (
              <div className="px-2.5 pb-2">
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Public Boards
                </p>
                {projectsWithBoards.map((p) => {
                  const slug = boardSlugs[p.id]
                  return (
                    <a
                      key={p.id}
                      href={`/p/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{p.name}</span>
                      <ExternalLink className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                    </a>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* Bottom section — pinned, never scrolls off */}
        <div className="shrink-0 space-y-1 border-t p-2.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-[13px] font-medium text-muted-foreground hover:text-foreground',
              collapsed ? 'justify-center px-2' : 'justify-start px-3'
            )}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className={cn('h-[17px] w-[17px] shrink-0', !collapsed && 'mr-2.5')} />
            ) : (
              <Moon className={cn('h-[17px] w-[17px] shrink-0', !collapsed && 'mr-2.5')} />
            )}
            {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
          </Button>

          {/* User row */}
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2',
              collapsed && 'justify-center px-0'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                'bg-[hsl(var(--primary)/0.12)] text-[12px] font-semibold text-primary',
                'ring-1 ring-[hsl(var(--primary)/0.15)]'
              )}
            >
              {displayName[0].toUpperCase()}
            </div>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight">{displayName}</p>
                  {user.email && (
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card/95 backdrop-blur-xl md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-[3px] pb-1.5 pt-2.5',
                'transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active indicator: top pill */}
              <span
                className={cn(
                  'absolute left-1/2 top-0 h-0.5 -translate-x-1/2 rounded-full bg-primary',
                  'transition-all duration-200 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]',
                  isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                )}
              />
              <item.icon
                className={cn(
                  'h-[19px] w-[19px] transition-transform duration-150',
                  isActive && 'scale-[1.08]'
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-medium transition-all duration-150',
                  isActive ? 'opacity-100' : 'opacity-60'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
