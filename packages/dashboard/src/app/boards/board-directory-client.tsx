'use client'

import * as React from 'react'
import Link from 'next/link'
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
  feedbackCount: number
  voteCount: number
  publicReplyCount: number
  branding: BoardBranding
  scores: Record<BoardSortMode, number>
  recentActivityAt: string | null
  updatedAt: string
}

function sortEntries(entries: BoardDirectoryEntry[], sort: BoardSortMode): BoardDirectoryEntry[] {
  return [...entries].sort((a, b) => {
    const diff = b.scores[sort] - a.scores[sort]
    if (diff !== 0) return diff
    return new Date(b.recentActivityAt || b.updatedAt).getTime() - new Date(a.recentActivityAt || a.updatedAt).getTime()
  })
}

const SORT_OPTIONS: Array<{ value: BoardSortMode; label: string; description: string }> = [
  { value: 'trending', label: 'Trending', description: 'Boards with the most recent public activity.' },
  { value: 'active', label: 'Active', description: 'Boards with frequent feedback and replies.' },
  { value: 'responsive', label: 'Responsive', description: 'Boards where teams close the loop publicly.' },
  { value: 'shipping', label: 'Shipping fast', description: 'Boards with strong in-progress and shipped signals.' },
  { value: 'new', label: 'New', description: 'Freshly published boards worth a look.' },
]

interface BoardDirectoryClientProps {
  entries: BoardDirectoryEntry[]
  categories: string[]
  initialSort: BoardSortMode
  initialCategory: string
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

  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) || SORT_OPTIONS[0]

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
    <>
      <section className="mt-6 rounded-3xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSort(option.value)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm transition',
                  sort === option.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search boards..."
                className="h-10 min-w-[200px] rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">{activeSort.description}</p>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                !category
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-border/80',
              )}
            >
              All categories
            </button>
            {categories.map((entry) => (
              <button
                key={entry}
                onClick={() => setCategory(category === entry ? '' : entry)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  category === entry
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-border/80',
                )}
              >
                {entry}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((entry) => (
          <Link
            key={entry.slug}
            href={`/p/${entry.slug}`}
            className="rounded-3xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: entry.branding.accentColor || '#0f766e' }}
              >
                {entry.branding.logoEmoji || (entry.displayName || entry.title).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {entry.displayName || entry.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{entry.projectName}</p>
              </div>
            </div>

            {entry.branding.tagline && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {entry.branding.tagline}
              </p>
            )}
            {!entry.branding.tagline && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {entry.description}
              </p>
            )}

            {entry.branding.categories && entry.branding.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.branding.categories.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{entry.feedbackCount} ideas</span>
              <span>{entry.voteCount} votes</span>
              <span>{entry.publicReplyCount} replies</span>
            </div>
          </Link>
        ))}
      </section>

      {sorted.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed bg-card/90 p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No boards match that filter yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {search.trim()
              ? `No results for "${search}". Try a different search.`
              : 'Try a different category or switch back to all boards.'}
          </p>
        </div>
      )}
    </>
  )
}
