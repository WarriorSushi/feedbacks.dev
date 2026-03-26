'use client'

import * as React from 'react'

interface BoardFeedbackListProps {
  children: React.ReactNode
  emptyTitle: string
  emptyDescription: string
  searchQuery: string
  isEmpty: boolean
}

export function BoardFeedbackList({
  children,
  emptyTitle,
  emptyDescription,
  searchQuery,
  isEmpty,
}: BoardFeedbackListProps) {
  if (isEmpty) {
    return (
      <div className="rounded-3xl border border-dashed bg-card/90 p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {searchQuery.trim()
            ? `No results for "${searchQuery}". Try another search or clear the filters.`
            : emptyDescription}
        </p>
      </div>
    )
  }

  return <div className="space-y-4">{children}</div>
}
