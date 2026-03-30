'use client'

import Link from 'next/link'

interface BoardFooterProps {
  canModerate: boolean
  projectId: string
}

export function BoardFooter({ canModerate, projectId }: BoardFooterProps) {
  return (
    <footer className="rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="https://feedbacks.dev"
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Powered by feedbacks.dev
        </Link>
        {canModerate && (
          <Link
            href={`/projects/${projectId}?tab=board`}
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage board
          </Link>
        )}
      </div>
    </footer>
  )
}
