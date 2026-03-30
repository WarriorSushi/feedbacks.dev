'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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

function sortEntries(entries: BoardDirectoryEntry[], sort: BoardSortMode): BoardDirectoryEntry[] {
  return [...entries].sort((a, b) => {
    const diff = b.scores[sort] - a.scores[sort]
    if (diff !== 0) return diff
    return (
      new Date(b.recentActivityAt || b.updatedAt).getTime() -
      new Date(a.recentActivityAt || a.updatedAt).getTime()
    )
  })
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
  categories: string[]
  initialSort: BoardSortMode
  initialCategory: string
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
  categories,
  initialSort,
  initialCategory,
}: BoardDirectoryClientProps) {
  const [sort, setSort] = React.useState<BoardSortMode>(initialSort)
  const [category, setCategory] = React.useState(initialCategory)
  const [search, setSearch] = React.useState('')
  const [ready, setReady] = React.useState(false)

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) || SORT_OPTIONS[0]

  React.useEffect(() => {
    setReady(true)
  }, [])

  const sorted = React.useMemo(() => {
    let filtered = entries
    if (category) {
      filtered = filtered.filter((entry) => entry.branding.categories?.includes(category))
    }
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          (entry.displayName || entry.title).toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          entry.projectName.toLowerCase().includes(query),
      )
    }
    return sortEntries(filtered, sort)
  }, [entries, category, search, sort])

  return (
    <div data-board-directory-ready={ready ? 'true' : 'false'}>
      <section className="mt-6 rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="border-b border-border/70 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Browse boards
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      sort === option.value
                        ? 'border-foreground bg-foreground text-background shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search boards..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="max-w-[220px] text-sm leading-6 text-foreground/68">
                {activeSort.description}
              </p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  !category
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                All categories
              </button>
              {categories.map((entry) => (
                <button
                  key={entry}
                  onClick={() => setCategory(category === entry ? '' : entry)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    category === entry
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {entry}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{sorted.length}</span> of{' '}
            <span className="font-medium text-foreground">{entries.length}</span> boards
          </span>
          <span className="hidden sm:inline">{activeSort.label} first</span>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {sorted.map((entry) => (
          <Link
            key={entry.slug}
            href={`/p/${entry.slug}`}
            className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-colors hover:border-foreground/20 hover:shadow-md"
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

            <p className="mt-4 text-sm leading-7 text-foreground/72">
              {entry.branding.tagline || entry.description}
            </p>

            {entry.branding.categories && entry.branding.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.branding.categories.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
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

      {sorted.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border/80 bg-card px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No boards match that filter yet</h2>
          <p className="mt-3 text-sm leading-7 text-foreground/68">
            {search.trim()
              ? `No results for "${search}". Try a different search.`
              : 'Try a different category or switch back to all boards.'}
          </p>
        </div>
      )}
    </div>
  )
}
