'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getHistoryWindowStart } from '@feedbacks/shared'
import { parseFeedbackReadStateFilter } from '@/lib/feedback-read-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  cn,
  statusConfig as globalStatusConfig,
} from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { BillingSummary, Feedback, FeedbackPriority, FeedbackStatus, FeedbackType } from '@/lib/types'
import { CURRENT_PROJECT_COOKIE, getSelectedProject } from '@/lib/project-selection'
import { FeedbackProjectScope } from './feedback-project-scope'
import { SavedInboxViews } from './saved-inbox-views'
import { PageHeader } from '@/components/ui/workspace-shell'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Tag,
  MessageSquare,
  Bot,
  ClipboardList,
  EyeOff,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react'
import {
  FeedbackFilterPill,
  FeedbackInboxEmptyState,
  FeedbackInboxRow,
  FeedbackTypeIcon,
} from './feedback-inbox-components'

const PAGE_SIZE = 20

const types: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const priorities: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']

const statusMeta = globalStatusConfig
interface ProjectFilterOption {
  id: string
  name: string
  settings?: { icon?: string } | null
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export default function FeedbackInboxPage() {
  return (
    <Suspense>
      <FeedbackInboxInner />
    </Suspense>
  )
}

function FeedbackInboxInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])

  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([])
  const [projects, setProjects] = React.useState<ProjectFilterOption[]>([])
  const [projectsLoaded, setProjectsLoaded] = React.useState(false)
  const [defaultProjectId, setDefaultProjectId] = React.useState('')
  const [billingSummary, setBillingSummary] = React.useState<BillingSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = React.useState(false)
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null)

  const requestedPage = Number(searchParams.get('page') || '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const search = searchParams.get('q') || ''
  const agent = searchParams.get('agent') || ''
  const publicOnly = searchParams.get('public') === '1'
  const priority = priorities.includes(searchParams.get('priority') as FeedbackPriority)
    ? (searchParams.get('priority') as FeedbackPriority)
    : ''
  const requestedProjectId = searchParams.get('projectId')
  const showingAllProjects = requestedProjectId === 'all'
  const projectId = showingAllProjects ? '' : requestedProjectId || defaultProjectId
  const tag = searchParams.get('tag') || ''
  const read = parseFeedbackReadStateFilter(searchParams.get('read'))
  const sort = ['newest', 'oldest', 'recently_updated'].includes(searchParams.get('sort') || '')
    ? (searchParams.get('sort') as 'newest' | 'oldest' | 'recently_updated')
    : 'newest'
  const [searchInput, setSearchInput] = React.useState(search)
  const [tagInput, setTagInput] = React.useState(tag)
  const [bulkTagInput, setBulkTagInput] = React.useState('')
  const [showMoreFilters, setShowMoreFilters] = React.useState(
    Boolean(type || tag || agent || publicOnly || priority || (status && status !== 'new' && status !== 'planned')),
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)

  React.useEffect(() => {
    setSearchInput(search)
    setTagInput(tag)
  }, [search, tag])

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === '/' && !event.shiftKey) {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('[aria-label="Search feedback"]')?.focus()
        return
      }

      if ((event.key === 'j' || event.key === 'k') && feedbacks.length > 0) {
        event.preventDefault()
        const currentIndex = feedbacks.findIndex((feedback) => feedback.id === activeRowId)
        const nextIndex = event.key === 'j'
          ? Math.min(feedbacks.length - 1, currentIndex < 0 ? 0 : currentIndex + 1)
          : Math.max(0, currentIndex < 0 ? feedbacks.length - 1 : currentIndex - 1)
        const nextId = feedbacks[nextIndex].id
        setActiveRowId(nextId)
        requestAnimationFrame(() => {
          document.querySelector(`[data-feedback-row-id="${nextId}"]`)?.scrollIntoView({ block: 'nearest' })
        })
        return
      }

      if (event.key === 'Enter' && activeRowId) {
        event.preventDefault()
        router.push(`/feedback/${activeRowId}`)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [activeRowId, feedbacks, router])

  React.useEffect(() => {
    const controller = new AbortController()
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, settings')
        .order('name', { ascending: true })
        .abortSignal(controller.signal)
      if (controller.signal.aborted) return
      const nextProjects = (data as ProjectFilterOption[]) || []
      const savedProjectId = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith(`${CURRENT_PROJECT_COOKIE}=`))
        ?.split('=')[1]
      const selectedProject = getSelectedProject(nextProjects, savedProjectId ? decodeURIComponent(savedProjectId) : undefined)
      setProjects(nextProjects)
      setDefaultProjectId(selectedProject?.id || '')
      setProjectsLoaded(true)
    }

    void fetchProjects()
    return () => controller.abort()
  }, [supabase])

  React.useEffect(() => {
    const controller = new AbortController()
    const fetchBilling = async () => {
      try {
        const response = await fetch('/api/billing/sync', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) return
        const data = await response.json()
        if (controller.signal.aborted) return
        setBillingSummary(data)
      } catch {
        // keep inbox usable even if billing lookup fails
      }
    }

    void fetchBilling()
    return () => controller.abort()
  }, [])

  const fetchFeedback = React.useCallback(async (signal?: AbortSignal) => {
    if (!projectsLoaded) return
    setLoading(true)
    let query = supabase
      .from('feedback')
      .select('*, projects(id, name)', { count: 'exact' })
      .eq('is_archived', false)
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) query = query.ilike('message', `%${search}%`)
    if (agent) query = query.not('agent_name', 'is', null)
    if (publicOnly) query = query.eq('is_public', true)
    if (priority === 'high') query = query.in('priority', ['high', 'critical'])
    else if (priority) query = query.eq('priority', priority)
    if (projectId) query = query.eq('project_id', projectId)
    if (tag) query = query.contains('tags', [tag])
    if (read === 'unread') query = query.is('read_at', null)
    const historyCutoff = billingSummary ? getHistoryWindowStart(billingSummary.entitlements) : null
    if (historyCutoff) query = query.gte('created_at', historyCutoff)
    if (sort === 'oldest') query = query.order('created_at', { ascending: true })
    else if (sort === 'recently_updated') query = query.order('updated_at', { ascending: false })
    else query = query.order('created_at', { ascending: false })
    if (signal) query = query.abortSignal(signal)

    const { data, count, error } = await query
    if (signal?.aborted) return
    if (error) {
      setLoading(false)
      toast({
        title: 'Could not load feedback',
        description: 'The list may be out of date. Check your connection and retry.',
        variant: 'destructive',
      })
      return
    }
    setFeedbacks((data as Feedback[]) || [])
    setTotal(count || 0)
    setSelected(new Set())
    setLoading(false)
  }, [supabase, page, projectId, projectsLoaded, status, tag, type, search, agent, publicOnly, priority, read, sort, billingSummary])

  React.useEffect(() => {
    const controller = new AbortController()
    void fetchFeedback(controller.signal)
    return () => controller.abort()
  }, [fetchFeedback])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    if (updates.page === undefined) params.set('page', '1')
    router.push(`/feedback?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput })
  }

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ tag: normalizeTag(tagInput) })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === feedbacks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(feedbacks.map((f) => f.id)))
    }
  }

  const bulkUpdateStatus = async (newStatus: FeedbackStatus) => {
    if (selected.size === 0) return
    setBulkLoading(true)
    const { error } = await supabase
      .from('feedback')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', Array.from(selected))
    setBulkLoading(false)
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: `${selected.size} item${selected.size > 1 ? 's' : ''} updated` })
    if (newStatus !== 'new') {
      const projectIds = Array.from(new Set(
        feedbacks.filter((feedback) => selected.has(feedback.id)).map((feedback) => feedback.project_id),
      ))
      projectIds.forEach((selectedProjectId) => {
        void fetch(`/api/projects/${selectedProjectId}/activation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'first_feedback_triaged' }),
        })
      })
    }
    fetchFeedback()
  }

  const bulkUpdateTags = async (action: 'add' | 'remove') => {
    const nextTag = normalizeTag(bulkTagInput)
    if (!nextTag || selected.size === 0) return

    setBulkLoading(true)
    const selectedFeedback = feedbacks.filter((feedback) => selected.has(feedback.id))
    const results = await Promise.all(
      selectedFeedback.map((feedback) => {
        const currentTags = Array.from(new Set((feedback.tags || []).map(normalizeTag)))
        const nextTags =
          action === 'add'
            ? Array.from(new Set([...currentTags, nextTag])).slice(0, 10)
            : currentTags.filter((tagValue) => tagValue !== nextTag)

        return supabase
          .from('feedback')
          .update({
            tags: nextTags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', feedback.id)
      }),
    )
    setBulkLoading(false)

    const firstError = results.find((result) => result.error)?.error
    if (firstError) {
      toast({ title: 'Failed to update tags', description: firstError.message, variant: 'destructive' })
      return
    }

    toast({
      title: action === 'add' ? 'Tag added to selected items' : 'Tag removed from selected items',
    })
    setBulkTagInput('')
    fetchFeedback()
  }

  const bulkMarkUnread = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    const { error } = await supabase
      .from('feedback')
      .update({ read_at: null })
      .in('id', Array.from(selected))
    setBulkLoading(false)
    if (error) {
      toast({ title: 'Failed to mark unread', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: `${selected.size} item${selected.size > 1 ? 's' : ''} marked unread` })
    fetchFeedback()
  }

  const clearBulkSelection = () => setSelected(new Set())

  const hasFilters = status || type || search || agent || publicOnly || priority || projectId || tag || read === 'unread'
  return (
    <div className="space-y-5 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      {/* ─── Header ─────────────────────────────────────── */}
      <PageHeader
        eyebrow="Inbox"
        title="Feedback"
        description="Review new messages and move the useful signal forward."
        meta={billingSummary?.entitlements.historyDays && (
          <p className="text-xs text-muted-foreground">
            Free plan shows the most recent {billingSummary.entitlements.historyDays} days.
          </p>
        )}
        action={<div className="text-right"><p className="text-xl font-semibold tabular-nums">{loading ? '…' : total}</p><p className="text-xs text-muted-foreground">{hasFilters ? 'shown' : total === 1 ? 'message' : 'messages'}</p></div>}
      />

      {/* ─── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form data-tour="inbox-search" onSubmit={handleSearch} className="w-full lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search feedback…"
                aria-label="Search feedback"
                className="h-10 w-full pl-9 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchInput('')
                    updateParams({ q: '' })
                  }}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex min-w-0 items-center gap-2">
          <div data-tour="inbox-filters" className="scroll-fade-x -mx-4 flex min-w-0 snap-x items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-thin md:mx-0 md:px-0">
          <FeedbackFilterPill
            active={!status && read === 'all'}
            onClick={() => updateParams({ status: '', read: '' })}
          >
            All
          </FeedbackFilterPill>
          <FeedbackFilterPill
            active={read === 'unread'}
            onClick={() => updateParams({ read: read === 'unread' ? '' : 'unread' })}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Unread
          </FeedbackFilterPill>
          {(['new', 'planned'] as FeedbackStatus[]).map((s) => (
            <FeedbackFilterPill
              key={s}
              active={status === s}
              onClick={() => updateParams({ status: status === s ? '' : s })}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', statusMeta[s].dot)}
              />
              {statusMeta[s].label}
            </FeedbackFilterPill>
          ))}

          <button type="button" onClick={() => setShowMoreFilters((value) => !value)} aria-expanded={showMoreFilters} className={cn('flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-md border px-3 text-[11px] font-medium md:min-h-8', showMoreFilters ? 'border-primary/30 bg-surface-selected text-foreground' : 'border-transparent bg-surface-raised text-muted-foreground hover:text-foreground')}><SlidersHorizontal className="h-3.5 w-3.5"/> More filters</button>

          {hasFilters && (
            <button
              onClick={() => {
                setSearchInput('')
                setTagInput('')
                updateParams({ status: '', type: '', q: '', agent: '', public: '', priority: '', projectId: '', tag: '', read: '' })
              }}
              className="ml-1 flex min-h-10 flex-shrink-0 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:min-h-8"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          </div>
          <label className="relative flex shrink-0 items-center">
            <ArrowUpDown aria-hidden="true" className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Sort feedback</span>
            <select
              aria-label="Sort feedback"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="h-10 rounded-md border bg-background pl-8 pr-7 text-xs md:h-8"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="recently_updated">Recently updated</option>
            </select>
          </label>
          </div>
        </div>

        <FeedbackProjectScope
          projects={projects}
          selectedProjectId={projectId}
          showingAllProjects={showingAllProjects}
          onSelect={(nextProjectId) => updateParams({ projectId: nextProjectId })}
        />

        {showMoreFilters && (
          <div className="space-y-3 rounded-md border bg-surface-raised p-4">
            <div className="flex flex-wrap gap-1.5">
              {(['reviewed', 'in_progress', 'closed'] as FeedbackStatus[]).map((s) => <FeedbackFilterPill key={s} active={status === s} onClick={() => updateParams({ status: status === s ? '' : s })}><span className={cn('h-1.5 w-1.5 rounded-full', statusMeta[s].dot)}/>{statusMeta[s].label}</FeedbackFilterPill>)}
              {types.map((t) => <FeedbackFilterPill key={t} active={type === t} onClick={() => updateParams({ type: type === t ? '' : t })}><FeedbackTypeIcon type={t} className="h-3.5 w-3.5"/><span className="capitalize">{t}</span></FeedbackFilterPill>)}
              <FeedbackFilterPill active={agent === '1'} onClick={() => updateParams({ agent: agent === '1' ? '' : '1' })}><Bot className="h-3.5 w-3.5"/>Agent</FeedbackFilterPill>
              <FeedbackFilterPill active={publicOnly} onClick={() => updateParams({ public: publicOnly ? '' : '1' })}><MessageSquare className="h-3.5 w-3.5"/>Public board</FeedbackFilterPill>
              <FeedbackFilterPill active={priority === 'high'} onClick={() => updateParams({ priority: priority === 'high' ? '' : 'high' })}><Star className="h-3.5 w-3.5"/>High priority</FeedbackFilterPill>
            </div>
            <form onSubmit={handleTagSearch} className="max-w-sm">
              <div className="relative"><Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"/><Input placeholder="Find a tag…" aria-label="Filter feedback by tag" className="h-9 w-full pl-9 text-sm" value={tagInput} onChange={(e) => setTagInput(e.target.value)}/>{tagInput && <button type="button" aria-label="Clear tag filter" onClick={() => { setTagInput(''); updateParams({ tag: '' }) }} className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5"/></button>}</div>
            </form>
            <SavedInboxViews currentQuery={searchParams.toString()} />
          </div>
        )}
      </div>

      {/* ─── Main List ────────────────────────────────────── */}
      <section data-tour="inbox-list" className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : feedbacks.length === 0 ? (
          <FeedbackInboxEmptyState hasFilters={!!hasFilters} hasProjects={projects.length > 0} onClear={() => {
            setSearchInput('')
            setTagInput('')
            updateParams({ status: '', type: '', q: '', agent: '', public: '', priority: '', projectId: '', tag: '', read: '' })
          }} />
        ) : (
          <div>
            {/* Select-all header */}
            <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3">
              <input
                type="checkbox"
                checked={selected.size === feedbacks.length && feedbacks.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border accent-primary"
                aria-label="Select all"
              />
              <span className="text-xs text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} selected`
                  : `Select all on this page`}
              </span>
            </div>

            {feedbacks.map((fb, index) => (
                  <FeedbackInboxRow
                    key={fb.id}
                    fb={fb}
                    selected={selected.has(fb.id)}
                    active={activeRowId === fb.id}
                    onToggle={() => toggleSelect(fb.id)}
                tourTarget={index === 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Pagination ──────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {buildPageRange(page, totalPages).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => updateParams({ page: String(p) })}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── Floating Bulk Action Bar ────────────────────── */}
      {selected.size > 0 && <div
        role="region"
        aria-label="Bulk feedback actions"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 md:bottom-6 md:w-auto"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg border bg-background px-3 py-2 shadow-xl ring-1 ring-black/5 scrollbar-thin dark:ring-white/5 md:rounded-full">
          <span className="shrink-0 pl-1 pr-2 text-xs font-semibold">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium"
            disabled={bulkLoading}
            onClick={() => bulkUpdateStatus('reviewed')}
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            Review
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium"
            disabled={bulkLoading}
            onClick={() => bulkUpdateStatus('planned')}
          >
            <ClipboardList className="h-3.5 w-3.5 text-primary" />
            Plan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium text-destructive hover:text-destructive"
            disabled={bulkLoading}
            onClick={() => bulkUpdateStatus('closed')}
          >
            <XCircle className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium"
            disabled={bulkLoading}
            onClick={() => void bulkMarkUnread()}
          >
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            Mark unread
          </Button>
          <div className="h-4 w-px bg-border" />
          <Input
            value={bulkTagInput}
            onChange={(e) => setBulkTagInput(e.target.value)}
            placeholder="tag"
            aria-label="Tag for selected feedback"
            className="h-8 w-28 shrink-0 rounded-full px-2.5 text-[12px]"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium"
            disabled={bulkLoading || !bulkTagInput.trim()}
            onClick={() => bulkUpdateTags('add')}
          >
            Add tag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-medium"
            disabled={bulkLoading || !bulkTagInput.trim()}
            onClick={() => bulkUpdateTags('remove')}
          >
            Remove tag
          </Button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={clearBulkSelection}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Deselect all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {bulkLoading && (
            <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>}
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────── */

function buildPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | null)[] = []
  const addPage = (n: number) => pages.push(n)
  const addGap = () => pages.push(null)

  addPage(1)
  if (current > 3) addGap()
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    addPage(p)
  }
  if (current < total - 2) addGap()
  addPage(total)

  return pages
}
