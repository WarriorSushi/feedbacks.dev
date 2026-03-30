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
  const hiddenCount = announcements.length - visibleCount

  return (
    <section className="rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/70 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Updates
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">Latest from the team</h2>
      </div>
      <div className="space-y-3 p-4">
        {announcements.slice(0, visibleCount).map((announcement) => (
          <article
            key={announcement.id}
            className="rounded-xl border border-border/70 bg-background px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(announcement.publishedAt)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-foreground/72">{announcement.body}</p>
            {announcement.href && (
              <a
                href={announcement.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Read update
              </a>
            )}
          </article>
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded((value) => !value)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {expanded ? 'Show fewer updates' : `Show ${hiddenCount} more update${hiddenCount === 1 ? '' : 's'}`}
          </button>
        )}
      </div>
    </section>
  )
}
