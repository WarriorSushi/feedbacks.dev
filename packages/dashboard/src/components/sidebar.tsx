'use client'

import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import {
  House,
  ClipboardPenLine,
  Inbox,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Check,
  Globe,
  ExternalLink,
  Plus,
  Loader2,
  Webhook,
  Code2,
  CircleHelp,
  Library,
  Megaphone,
  Gift,
  Sparkles,
  FolderCog,
  MessageSquareText,
} from 'lucide-react'
import type { Project } from '@/lib/types'
import { createClient } from '@/lib/supabase-browser'
import { ThemeToggle } from '@/components/theme-toggle'
import type { BillingStatus, PlanTier } from '@feedbacks/shared'
import { CURRENT_PROJECT_COOKIE } from '@/lib/project-selection'
import { DEFAULT_PROJECT_ICON } from '@/lib/project-icons'
import { getProjectDestination } from '@/lib/project-navigation'
import { getProjectRoute, getProjectRouteSection } from '@/lib/project-routes'
import {
  hasActivePro,
  PRO_CELEBRATION_COMPLETE_EVENT,
} from '@/lib/pro-activation'

type SidebarProject = Pick<Project, 'id' | 'name'> & { settings?: Project['settings'] | null }

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  tourId: string
  exact?: boolean
  projectTab?: string
  external?: boolean
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const primaryNavGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Home', icon: House, exact: true, tourId: 'nav-dashboard' },
    ],
  },
  {
    label: 'Collect',
    items: [
      { href: '/feedback-form', label: 'Feedback form', icon: ClipboardPenLine, tourId: 'nav-feedback-form', projectTab: 'feedback-form' },
      { href: '/feedback', label: 'Feedback inbox', icon: Inbox, tourId: 'nav-feedback' },
    ],
  },
  {
    label: 'Share with users',
    items: [
      { href: '/release-notes', label: 'Updates for users', icon: Megaphone, tourId: 'nav-updates', projectTab: 'release-notes' },
      { href: '/board', label: 'My public page', icon: Globe, tourId: 'nav-boards', projectTab: 'board' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { href: '/install', label: 'Install & verify', icon: Code2, tourId: 'nav-install', projectTab: 'install' },
      { href: '/integrations', label: 'Integrations', icon: Webhook, tourId: 'nav-integrations', projectTab: 'integrations' },
      { href: '/api', label: 'API & MCP', icon: Code2, tourId: 'nav-api', projectTab: 'api' },
    ],
  },
]

const accountMenuItems: NavItem[] = [
  { href: '/billing',   label: 'Billing',   icon: CreditCard, tourId: 'nav-billing' },
]

const bottomNavItems: NavItem[] = [
  { href: 'https://www.feedbacks.dev/docs', label: 'Docs', icon: Library, tourId: 'nav-docs', external: true },
  { href: '/invites', label: 'Pro for free', icon: Gift, tourId: 'nav-invites' },
  { href: '/settings', label: 'Settings', icon: Settings, tourId: 'nav-settings' },
]

interface SidebarProps {
  user: { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } }
  projects: SidebarProject[]
  currentProjectId?: string
  boardSlugs?: Record<string, string>
  billingAccount?: {
    plan_tier: PlanTier
    billing_status: BillingStatus
    complimentary_pro_until: string | null
    grace_ends_at: string | null
  } | null
  earlyAdopterProgrammeActive?: boolean
  earlyAdopterProgramme?: {
    status: 'accepted' | 'onboarding' | 'active' | 'grace' | 'finishing' | 'completed' | 'removed'
    proMonthsEarned: number
    feedbackOpensAt: string | null
    graceEndsAt: string | null
    programmeEndsAt: string | null
    feedbackOpen: boolean
  } | null
}

function formatProgrammeDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function getProgrammeSummary(programme: NonNullable<SidebarProps['earlyAdopterProgramme']>) {
  const onboarding = programme.status === 'accepted' || programme.status === 'onboarding'
  const attention = onboarding || programme.status === 'grace' || programme.feedbackOpen
  if (onboarding) return { detail: 'Guided onboarding required', attention }
  if (programme.status === 'grace') {
    return { detail: `Renew by ${formatProgrammeDate(programme.graceEndsAt) || 'the grace deadline'}`, attention }
  }
  if (programme.feedbackOpen) return { detail: 'Feedback check-in ready', attention }
  if (programme.status === 'finishing') return { detail: 'All 12 Pro months earned', attention }
  if (programme.status === 'completed') return { detail: 'Programme complete', attention }
  if (programme.status === 'removed') return { detail: 'Programme ended', attention }
  const nextCheckIn = formatProgrammeDate(programme.feedbackOpensAt)
  return {
    detail: `Pro month ${programme.proMonthsEarned} of 12 · ${nextCheckIn ? `Next ${nextCheckIn}` : 'Active'}`,
    attention,
  }
}

export function Sidebar({ user, projects, currentProjectId, boardSlugs = {}, billingAccount, earlyAdopterProgrammeActive = false, earlyAdopterProgramme = null }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const currentHref = search ? `${pathname}?${search}` : pathname
  const routeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const boardProjectId = pathname === '/dashboard/boards' ? searchParams.get('project') || undefined : undefined
  const dashboardProjectId = pathname === '/dashboard' ? searchParams.get('project') || undefined : undefined
  const resolvedCurrentProjectId = routeProjectId || boardProjectId || dashboardProjectId || currentProjectId
  const [visibleProjects, setVisibleProjects] = React.useState(projects)
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)
  const [projectOpen, setProjectOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)
  const [proActivatedInSession, setProActivatedInSession] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const mobileDrawerRef = React.useRef<HTMLElement>(null)
  const mobileMenuButtonRef = React.useRef<HTMLButtonElement>(null)
  const supabase = React.useMemo(() => createClient(), [])

  React.useEffect(() => {
    setVisibleProjects(projects)
  }, [projects])

  React.useEffect(() => {
    const removeDeletedProject = (event: Event) => {
      const projectId = (event as CustomEvent<{ projectId?: string }>).detail?.projectId
      if (!projectId) return
      setVisibleProjects((current) => current.filter((project) => project.id !== projectId))
      setProjectOpen(false)
    }

    const updateProject = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string; name?: string }>).detail
      if (!detail?.projectId || !detail.name) return
      setVisibleProjects((current) => current.map((project) =>
        project.id === detail.projectId ? { ...project, name: detail.name! } : project,
      ))
    }

    const addProject = (event: Event) => {
      const project = (event as CustomEvent<{ project?: SidebarProject }>).detail?.project
      if (!project?.id || !project.name) return
      setVisibleProjects((current) =>
        current.some((item) => item.id === project.id) ? current : [...current, project],
      )
    }

    window.addEventListener('feedbacks:project-deleted', removeDeletedProject)
    window.addEventListener('feedbacks:project-updated', updateProject)
    window.addEventListener('feedbacks:project-created', addProject)
    return () => {
      window.removeEventListener('feedbacks:project-deleted', removeDeletedProject)
      window.removeEventListener('feedbacks:project-updated', updateProject)
      window.removeEventListener('feedbacks:project-created', addProject)
    }
  }, [])

  const currentProject = visibleProjects.find((p) => p.id === resolvedCurrentProjectId) || visibleProjects[0]
  const showProBrand = hasActivePro(billingAccount) || proActivatedInSession

  React.useEffect(() => {
    const landProBrand = () => setProActivatedInSession(true)
    window.addEventListener(PRO_CELEBRATION_COMPLETE_EVENT, landProBrand)
    return () => {
      window.removeEventListener(PRO_CELEBRATION_COMPLETE_EVENT, landProBrand)
    }
  }, [])

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
    setPendingHref(null)
  }, [currentHref])

  React.useEffect(() => {
    if (!mobileOpen) return

    const drawer = mobileDrawerRef.current
    const menuButton = mobileMenuButtonRef.current
    const main = document.querySelector<HTMLElement>('main')
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [])
    const previousMainAriaHidden = main?.getAttribute('aria-hidden')
    if (main) {
      main.inert = true
      main.setAttribute('aria-hidden', 'true')
    }
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => focusable()[0]?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (main) {
        main.inert = false
        if (previousMainAriaHidden == null) main.removeAttribute('aria-hidden')
        else main.setAttribute('aria-hidden', previousMainAriaHidden)
      }
      window.requestAnimationFrame(() => {
        menuButton?.focus()
      })
    }
  }, [mobileOpen])

  React.useEffect(() => {
    const expandForTour = () => {
      setCollapsed(false)
      if (window.matchMedia('(max-width: 767px)').matches) {
        setMobileOpen(true)
      }
    }
    const closeMobileForTour = () => setMobileOpen(false)
    window.addEventListener('feedbacks:expand-sidebar', expandForTour)
    window.addEventListener('feedbacks:close-mobile-sidebar', closeMobileForTour)
    return () => {
      window.removeEventListener('feedbacks:expand-sidebar', expandForTour)
      window.removeEventListener('feedbacks:close-mobile-sidebar', closeMobileForTour)
    }
  }, [])

  const beginNavigation = React.useCallback(
    (href: string) => {
      if (href === currentHref) return
      setPendingHref(href)
      router.prefetch(href)
    },
    [currentHref, router],
  )

  const rememberProject = React.useCallback((projectId: string) => {
    document.cookie = `${CURRENT_PROJECT_COOKIE}=${encodeURIComponent(projectId)}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [])

  const projectDestination = React.useCallback((projectId: string) => {
    return getProjectDestination({
      projectId,
      pathname,
      activeProjectTab: routeProjectId ? getProjectRouteSection(pathname) || searchParams.get('tab') : null,
    })
  }, [pathname, routeProjectId, searchParams])

  React.useEffect(() => {
    if (routeProjectId) rememberProject(routeProjectId)
  }, [rememberProject, routeProjectId])

  const projectIcon = (project?: SidebarProject) => project?.settings?.icon || DEFAULT_PROJECT_ICON
  const programmeSummary = earlyAdopterProgramme ? getProgrammeSummary(earlyAdopterProgramme) : null

  /* ── Shared sidebar content (used in both mobile drawer & desktop aside) ── */
  const sidebarContent = (
    <>
      {/* Logo row */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 px-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:flex"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <div
          className={cn(
            'ml-auto overflow-hidden transition-[width,opacity] duration-200',
            collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
          )}
        >
          <Link
            href="/dashboard"
            onClick={() => beginNavigation('/dashboard')}
            onMouseEnter={() => router.prefetch('/dashboard')}
            onFocus={() => router.prefetch('/dashboard')}
            className="flex justify-end whitespace-nowrap font-semibold transition-opacity active:opacity-70"
            aria-label="Go to Home"
            title="Home"
            tabIndex={collapsed ? -1 : 0}
          >
            <BrandWordmark
              className="text-[17px]"
              markClassName={cn('h-6 w-6', showProBrand && 'rounded-lg')}
              markSrc={showProBrand ? '/feedbacks.dev_pro_monthly.svg' : undefined}
              markAnchor
              intro={!collapsed}
            />
          </Link>
        </div>
      </div>

      {/* Project switcher */}
      {visibleProjects.length > 0 && !collapsed && (
        <div data-tour="project-switcher" className="shrink-0 border-b border-border/80 p-2.5" ref={dropdownRef}>
          <button
            onClick={() => setProjectOpen(!projectOpen)}
            aria-expanded={projectOpen}
            aria-label="Switch project"
            className={cn(
              'group flex min-h-12 w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[13px]',
              'border-border bg-card shadow-sm shadow-black/[0.025]',
              'transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-primary/25 hover:bg-surface-overlay',
              'active:scale-[0.99]',
              projectOpen && 'border-primary/35 bg-surface-overlay shadow-md shadow-black/[0.06]'
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm leading-none ring-1 ring-primary/10">
                {projectIcon(currentProject)}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground">Current project</span>
                <span className="block truncate font-medium leading-4">
                  {currentProject?.name ?? 'Select project'}
                </span>
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
              <div className="mt-1.5 overflow-hidden rounded-lg border border-border/80 bg-popover shadow-[var(--shadow-float)]">
                {visibleProjects.map((p) => {
                  const isSelected = p.id === resolvedCurrentProjectId
                  const destination = projectDestination(p.id)
                  return (
                    <Link
                      key={p.id}
                      href={destination}
                      onClick={() => {
                        rememberProject(p.id)
                        beginNavigation(destination)
                        setProjectOpen(false)
                      }}
                      onMouseEnter={() => router.prefetch(destination)}
                      onFocus={() => router.prefetch(destination)}
                      className={cn(
                        'flex min-h-11 items-center justify-between px-3 py-2 text-[13px] md:min-h-0',
                        'transition-[background-color,color,transform] duration-100 hover:bg-accent active:scale-[0.98] active:bg-accent/80',
                        isSelected && 'bg-accent/60'
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none">
                          {projectIcon(p)}
                        </span>
                        <span className={cn('truncate', isSelected && 'font-medium')}>
                          {p.name}
                        </span>
                      </span>
                      {pendingHref === destination ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                      ) : isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </Link>
                  )
                })}
                <div className="border-t border-border/80 p-1">
                  <Link
                    href="/projects"
                    onClick={() => beginNavigation('/projects')}
                    className="flex min-h-9 items-center rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <FolderCog className="mr-2 h-3.5 w-3.5" /> Manage projects
                  </Link>
                  <Link
                    href="/projects/new"
                    onClick={() => beginNavigation('/projects/new')}
                    className="flex min-h-9 items-center rounded-md px-2 text-xs font-medium text-primary hover:bg-accent"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" /> New project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {visibleProjects.length === 0 && !collapsed && (
        <div className="shrink-0 border-b border-border/80 p-2.5">
          <Link
            href="/projects/new"
            onClick={() => beginNavigation('/projects/new')}
            onMouseEnter={() => router.prefetch('/projects/new')}
            onFocus={() => router.prefetch('/projects/new')}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[13px] font-medium text-primary transition-[background-color,transform] hover:bg-primary/[0.1] active:scale-[0.98] active:bg-primary/[0.14]"
          >
            {pendingHref === '/projects/new' ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" />
            )}
            Create first project
          </Link>
        </div>
      )}

      {/* Nav scrolls when it overflows and pushes the footer down when it does not. */}
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5">
        <div className="space-y-3.5">
          {primaryNavGroups.map((group, groupIndex) => (
            <div key={group.label || 'home'} className="space-y-0.5">
              {!collapsed && group.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const projectTab = item.projectTab
                const scopedHref = projectTab && currentProject
                  ? getProjectRoute(currentProject.id, projectTab as Parameters<typeof getProjectRoute>[1])
                  : projectTab
                    ? `/project-required?feature=${encodeURIComponent(item.label)}`
                  : item.href
                const activeProjectSection = getProjectRouteSection(pathname)
                const isActive = projectTab
                  ? activeProjectSection === projectTab
                  : item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={scopedHref}
                    data-tour={item.tourId}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    onClick={() => { if (!item.external) beginNavigation(scopedHref) }}
                    onMouseEnter={() => { if (!item.external) router.prefetch(scopedHref) }}
                    onFocus={() => { if (!item.external) router.prefetch(scopedHref) }}
                    className={cn(
                      'group relative flex min-h-11 items-center gap-3 rounded-lg py-2 text-[13px] font-medium md:min-h-0',
                      'transition-[background-color,color,transform] duration-150 active:scale-[0.98]',
                      collapsed ? 'justify-center px-2' : 'px-3',
                      isActive
                        ? 'bg-surface-selected text-primary'
                        : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
                      collapsed && groupIndex > 0 && group.items[0] === item && 'mt-3',
                    )}
                  >
                    {pendingHref === scopedHref ? (
                      <Loader2 className="h-[17px] w-[17px] shrink-0 animate-spin text-primary" />
                    ) : (
                      <item.icon className={cn('h-[17px] w-[17px] shrink-0 transition-colors duration-150', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                    )}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.external ? <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-60" /> : null}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* The preview link follows the selected project instead of listing every project. */}
          {(() => {
            const slug = currentProject ? boardSlugs[currentProject.id] : undefined
            if (!slug || collapsed) return null
            return (
              <a
                href={`/p/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group ml-7 flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              >
                <span className="truncate">View live board</span>
                <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
              </a>
            )
          })()}
        </div>

      </nav>

      <div className="mt-auto shrink-0 border-t p-1.5">
        <div className="space-y-0.5">
          {earlyAdopterProgramme && programmeSummary ? (
            <Link
              href="/early-adopter"
              onClick={() => beginNavigation('/early-adopter')}
              title={collapsed ? `Early Adopter Programme. ${programmeSummary.detail}` : undefined}
              aria-label={collapsed ? `Early Adopter Programme. ${programmeSummary.detail}` : undefined}
              className={cn(
                'early-adopter-sidebar-item group relative mb-1 flex min-h-10 items-center gap-3 overflow-hidden rounded-lg border border-border/80 bg-card/70 py-1.5 text-[12px] transition-[background-color,border-color,transform] duration-150 hover:border-primary/30 hover:bg-surface-raised active:scale-[0.98]',
                collapsed ? 'justify-center px-2' : 'px-2.5',
                programmeSummary.attention && 'early-adopter-sidebar-item-attention',
              )}
            >
              <Sparkles className={cn('relative z-[1] h-[17px] w-[17px] shrink-0', programmeSummary.attention ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {!collapsed ? (
                <span className="relative z-[1] min-w-0 leading-tight">
                  <span className="block truncate font-semibold text-foreground">Early Adopter Programme</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{programmeSummary.detail}</span>
                </span>
              ) : null}
            </Link>
          ) : null}
          {bottomNavItems
            .filter((item) => item.href !== '/invites' || !earlyAdopterProgrammeActive)
            .map((item) => {
              const isActive = !item.external && (pathname === item.href || pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={item.tourId}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  onClick={() => { if (!item.external) beginNavigation(item.href) }}
                  className={cn(
                    'group flex min-h-8 items-center gap-3 rounded-md py-1.5 text-[13px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98]',
                    collapsed ? 'justify-center px-2' : 'px-3',
                    isActive ? 'bg-surface-selected text-primary' : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
                  )}
                >
                  {pendingHref === item.href ? <Loader2 className="h-[17px] w-[17px] animate-spin text-primary" /> : <item.icon className="h-[17px] w-[17px] shrink-0" />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.external ? <ExternalLink className="ml-auto h-3 w-3 opacity-60" /> : null}
                </Link>
              )
            })}
        </div>
      </div>

      {/* Footer stays visible at the bottom. */}
      <div className={cn('shrink-0 p-2', collapsed ? 'space-y-1' : 'flex items-center gap-1.5')}>
        <div data-tour="theme-switcher" className={cn(!collapsed && 'min-w-0 flex-1')}>
          <ThemeToggle collapsed={collapsed} className={cn(!collapsed && 'w-full')} />
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary ring-1 ring-primary/20 transition-[background-color,box-shadow,transform] hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 active:scale-[0.96]',
                collapsed && 'mx-auto',
              )}
              aria-label={`Open account menu for ${displayName}`}
              title={user.email || displayName}
            >
              {displayName[0].toUpperCase()}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side={collapsed ? 'right' : 'top'}
              align="start"
              sideOffset={8}
              collisionPadding={12}
              className="z-[70] min-w-[232px] rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-xl"
            >
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {user.email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p> : null}
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {accountMenuItems.map((item) => (
                <DropdownMenu.Item key={item.href} asChild>
                  <Link
                    href={item.href}
                    data-tour={item.tourId}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    onClick={() => { if (!item.external) beginNavigation(item.href) }}
                    className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    {item.external ? <ExternalLink className="h-3 w-3 text-muted-foreground" /> : null}
                  </Link>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Item asChild>
                <Link
                  href="/dashboard?tour=1"
                  data-tour="take-product-tour"
                  onClick={() => {
                    if (pathname === '/dashboard') window.dispatchEvent(new CustomEvent('feedbacks:start-product-tour'))
                    beginNavigation('/dashboard?tour=1')
                  }}
                  className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                  <CircleHelp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Product tour
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  data-feedbacks-trigger
                  onClick={() => window.dispatchEvent(new CustomEvent('feedbacks:open', {
                    detail: { projectKey: 'fb_pub_eca05612446143cb95127d91753e2a48' },
                  }))}
                  className="flex min-h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                  <MessageSquareText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Send feedback
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex min-h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium text-destructive outline-none transition-colors focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-surface-sidebar px-4 md:hidden">
        <Button
          ref={mobileMenuButtonRef}
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={() => {
            setCollapsed(false)
            setMobileOpen(!mobileOpen)
          }}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-drawer"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </Button>
        <Link
          href="/dashboard"
          onClick={() => beginNavigation('/dashboard')}
          className="font-semibold transition-opacity active:opacity-70"
        >
          <BrandWordmark
            className="text-[17px]"
            markClassName={cn('h-6 w-6', showProBrand && 'rounded-lg')}
            markSrc={showProBrand ? '/feedbacks.dev_pro_monthly.svg' : undefined}
            markAnchor
          />
        </Link>
      </div>

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile drawer (fixed, slides in) ──────────────────────────── */}
      {mobileOpen && (
        <aside
          ref={mobileDrawerRef}
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-surface-sidebar md:hidden"
        >
          {sidebarContent}
        </aside>
      )}

      {/* ── Desktop sidebar (static flex child, full height from parent) ─ */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:border-r md:border-border/80 md:bg-surface-sidebar',
          'transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]',
          collapsed ? 'md:w-[60px]' : 'md:w-[232px]'
        )}
      >
        {sidebarContent}
      </aside>

    </>
  )
}
