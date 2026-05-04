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
      <div className="border-b border-dashed border-border/80 px-6 py-14 text-center">
        <h2 className="text-xl font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-foreground/68">
          {searchQuery.trim()
            ? `No results for "${searchQuery}". Try another search or clear the filters.`
            : emptyDescription}
        </p>
      </div>
    )
  }

  return <div>{children}</div>
}
