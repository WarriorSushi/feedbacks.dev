'use client'

import * as React from 'react'
import type { BoardAnnouncement } from '@/lib/public-board'
import { formatDate } from './board-types'

interface BoardAnnouncementsProps {
  announcements: BoardAnnouncement[]
}

export function BoardAnnouncements({ announcements }: BoardAnnouncementsProps) {
  const [expanded, setExpanded] = React.useState(false)

  if (announcements.length === 0) return null

  const visibleCount = expanded ? announcements.length : Math.min(2, announcements.length)
  const hiddenCount = announcements.length - 2

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Updates
      </p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">Announcements</h2>
      <div className="mt-4 space-y-3">
        {announcements.slice(0, visibleCount).map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-2xl border border-border bg-muted/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
              <span className="text-xs text-muted-foreground">
                {formatDate(announcement.publishedAt)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {announcement.body}
            </p>
            {announcement.href && (
              <a
                href={announcement.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
              >
                Read more
              </a>
            )}
          </div>
        ))}
      </div>
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Show {hiddenCount} more
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Show less
        </button>
      )}
    </section>
  )
}
