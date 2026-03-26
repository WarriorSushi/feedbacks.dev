'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { typeConfig, type FilterType, type SortMode } from './board-types'

interface BoardFiltersProps {
  showTypes: string[]
  filter: FilterType
  sort: SortMode
  search: string
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: SortMode) => void
  onSearchChange: (search: string) => void
}

export function BoardFilters({
  showTypes,
  filter,
  sort,
  search,
  onFilterChange,
  onSortChange,
  onSearchChange,
}: BoardFiltersProps) {
  const filterTabs: Array<{ value: FilterType; label: string }> = [
    { value: 'all', label: 'All' },
    ...showTypes.map((type) => ({
      value: type as FilterType,
      label: typeConfig[type]?.label || type,
    })),
  ]

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm transition',
                filter === tab.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="votes">Most voted</option>
            <option value="newest">Newest</option>
            <option value="status">By status</option>
          </select>
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
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search requests..."
              className="h-10 min-w-[240px] rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
