'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowDown, ArrowUpRight, FolderOpen, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeBoardCategory, type BoardCategoryOption } from '@/lib/board-categories'
import type { BoardBranding } from '@/lib/public-board'

type BoardSortMode = 'trending' | 'active' | 'responsive' | 'shipping' | 'new'

interface BoardDirectoryEntry {
  id: string
  slug: string
  title: string
  description: string
  displayName: string | null
  projectName: string
  createdAt: string
  feedbackCount: number
  voteCount: number
  publicReplyCount: number
  recentlyShippedCount: number
  inProgressCount: number
  trustScore: number
  branding: BoardBranding
  scores: Record<BoardSortMode, number>
  recentActivityAt: string | null
  updatedAt: string
}

const SORT_OPTIONS: Array<{ value: BoardSortMode; label: string; description: string }> = [
  { value: 'trending', label: 'Trending', description: 'Recent public activity and momentum.' },
  { value: 'active', label: 'Active', description: 'Boards with consistent feedback and replies.' },
  { value: 'responsive', label: 'Responsive', description: 'Boards where teams close the loop publicly.' },
  { value: 'shipping', label: 'Shipping', description: 'Boards showing in-progress and shipped work.' },
  { value: 'new', label: 'New', description: 'Fresh boards worth checking early.' },
]

interface BoardDirectoryClientProps {
  entries: BoardDirectoryEntry[]
  total: number
  categories: BoardCategoryOption[]
  initialSort: BoardSortMode
  initialCategory: string
  initialQuery: string
  initialNextCursor: string | null
  initialHasMore: boolean
  variant?: 'public' | 'dashboard'
}

function formatActivity(date: string | null, fallback: string) {
  const target = new Date(date || fallback).getTime()
  const diff = Date.now() - target
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days < 30) return `Updated ${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return `Updated ${new Date(date || fallback).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function getBoardHealthLabel(entry: BoardDirectoryEntry) {
  if (entry.recentlyShippedCount > 0) return 'Shipping publicly'
  if (entry.publicReplyCount > 0) return 'Team responding'
  if (entry.inProgressCount > 0) return 'Work in progress'
  if (entry.feedbackCount > 0) return 'Collecting signal'
  return 'Fresh board'
}

export function BoardDirectoryClient({
  entries,
  total,
  categories,
  initialSort,
  initialCategory,
  initialQuery,
  initialNextCursor,
  initialHasMore,
  variant = 'public',
}: BoardDirectoryClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = React.useState(initialQuery)
  const [isPending, startTransition] = React.useTransition()
  const [ready, setReady] = React.useState(false)
  const [visibleEntries, setVisibleEntries] = React.useState(entries)
  const [nextCursor, setNextCursor] = React.useState(initialNextCursor)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [loadMoreError, setLoadMoreError] = React.useState('')
  const sort = initialSort
  const category = normalizeBoardCategory(initialCategory) || ''
  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) || SORT_OPTIONS[0]

  React.useEffect(() => {
    setReady(true)
  }, [])

  const hasNoBoards = total === 0 && !category && !initialQuery
  const dashboard = variant === 'dashboard'

  const updateUrl = React.useCallback((changes: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(changes)) {
      if (!value) params.delete(key)
      else params.set(key, value)
    }
    startTransition(() => {
      router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
    })
  }, [pathname, router])

  React.useEffect(() => {
    setSearch(initialQuery)
  }, [initialQuery])

  React.useEffect(() => {
    setVisibleEntries(entries)
    setNextCursor(initialNextCursor)
    setHasMore(initialHasMore)
    setLoadMoreError('')
  }, [entries, initialHasMore, initialNextCursor])

  React.useEffect(() => {
    if (search.trim() === initialQuery) return
    const timer = window.setTimeout(() => {
      updateUrl({ q: search.trim() || null })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [initialQuery, search, updateUrl])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError('')
    try {
      const params = new URLSearchParams({ cursor: nextCursor })
      if (sort !== 'trending') params.set('sort', sort)
      if (category) params.set('category', category)
      if (initialQuery) params.set('q', initialQuery)
      const response = await fetch(`/api/boards?${params.toString()}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !Array.isArray(payload?.boards)) {
        throw new Error(payload?.error || 'Could not load more boards.')
      }
      setVisibleEntries((current) => {
        const seen = new Set(current.map((entry) => entry.id))
        return [...current, ...payload.boards.filter((entry: BoardDirectoryEntry) => !seen.has(entry.id))]
      })
      setNextCursor(typeof payload.nextCursor === 'string' ? payload.nextCursor : null)
      setHasMore(payload.hasMore === true)
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : 'Could not load more boards.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div data-board-directory-ready={ready ? 'true' : 'false'}>
      <section data-board-directory-controls className="mt-4 scroll-mt-4 border-y border-border/80 sm:mt-6">
        <div className="border-b border-border/70 px-3 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Browse boards
              </p>
              <div className="scroll-fade-x -mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={sort === option.value}
                    onClick={() => updateUrl({ sort: option.value === 'trending' ? null : option.value })}
                    className={cn(
                      'min-h-11 shrink-0 snap-start rounded-full px-3 py-2 text-sm font-medium transition-colors sm:min-h-10',
                      sort === option.value
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="order-first flex flex-col gap-3 sm:flex-row sm:items-center lg:order-none">
              <div className="relative min-w-0 sm:min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search public boards"
                  placeholder="Search boards..."
                  className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground sm:h-10"
                />
              </div>
              <p className="hidden max-w-[220px] text-sm leading-6 text-foreground/68 sm:block">
                {activeSort.description}
              </p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="scroll-fade-x -mx-3 mt-4 flex snap-x gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <button
                type="button"
                aria-pressed={!category}
                onClick={() => updateUrl({ category: null })}
                className={cn(
                  'min-h-11 shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-9',
                  !category
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                All categories
              </button>
              {categories.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  aria-pressed={category === entry.value}
                  onClick={() => updateUrl({ category: category === entry.value ? null : entry.value })}
                  className={cn(
                    'min-h-11 shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-9',
                    category === entry.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {entry.label}
                  <span className="ml-1 text-[10px] opacity-70">{entry.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div aria-live="polite" className="flex items-center justify-between px-3 py-3 text-sm text-muted-foreground sm:px-5">
          <span>
            {total === 0 ? 'No boards found' : (
              <>
                Showing <span className="font-medium text-foreground">1–{Math.min(total, visibleEntries.length)}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> boards
              </>
            )}
          </span>
          <span className="hidden sm:inline">{isPending ? 'Updating…' : `${activeSort.label} first`}</span>
        </div>
      </section>

      <section className="mt-4 grid min-w-0 gap-4 sm:mt-6 xl:grid-cols-2">
        {visibleEntries.map((entry) => (
          <Link
            key={entry.slug}
            href={`/p/${entry.slug}`}
            className="group min-w-0 rounded-lg border border-border/80 bg-card p-4 shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md sm:rounded-2xl sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold text-foreground shadow-sm">
                  {entry.branding.logoEmoji || (entry.displayName || entry.title).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                    {entry.displayName || entry.title}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{entry.projectName}</p>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {getBoardHealthLabel(entry)}
                </p>
                <p className="mt-1 text-xs text-foreground/68">
                  {formatActivity(entry.recentActivityAt, entry.updatedAt)}
                </p>
              </div>
            </div>

            <p className="mt-4 break-words text-sm leading-7 text-foreground/72">
              {entry.branding.tagline || entry.description}
            </p>

            {entry.branding.categories && entry.branding.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.branding.categories.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="max-w-full break-words rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{entry.feedbackCount}</span> requests
                </span>
                <span>
                  <span className="font-semibold text-foreground">{entry.voteCount}</span> votes
                </span>
                <span>
                  <span className="font-semibold text-foreground">{entry.publicReplyCount}</span> replies
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-transform group-hover:translate-x-0.5">
                Open board
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {hasMore && nextCursor && (
        <div className="mt-6 border-t pt-5 text-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
            {loadingMore ? 'Loading more boards…' : `Show more boards (${Math.max(0, total - visibleEntries.length)} remaining)`}
          </button>
          {loadMoreError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {loadMoreError} Your current results are still available.
            </p>
          )}
        </div>
      )}

      {total === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/80 bg-card px-6 py-12 text-center shadow-sm">
          <FolderOpen className="mx-auto h-9 w-9 text-muted-foreground/45" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            {hasNoBoards
              ? dashboard
                ? 'No public boards are published yet'
                : 'No public boards yet'
              : 'No boards match that filter yet'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/68">
            {hasNoBoards
              ? dashboard
                ? 'Open a project, configure its board, and publish only when you are ready to collect public requests, votes, and replies.'
                : 'Boards will appear here when teams publish public feedback spaces.'
              : search.trim()
                ? `No results for "${search}". Try a different search.`
                : 'Try a different category or switch back to all boards.'}
          </p>
          {!hasNoBoards && (
            <button
              type="button"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-semibold hover:bg-accent"
              onClick={() => {
                setSearch('')
                updateUrl({ q: null, category: null })
              }}
            >
              Clear filters
            </button>
          )}
          {hasNoBoards && dashboard && (
            <Link
              href="/projects"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open projects
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
