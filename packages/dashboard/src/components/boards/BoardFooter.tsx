'use client'

import Link from 'next/link'

interface BoardFooterProps {
  canModerate: boolean
  projectId: string
}

export function BoardFooter({ canModerate, projectId }: BoardFooterProps) {
  return (
    <footer className="py-6 text-center">
      <Link
        href="https://feedbacks.dev"
        className="text-xs text-muted-foreground transition hover:text-foreground"
      >
        Powered by feedbacks.dev
      </Link>
      {canModerate && (
        <div className="mt-2">
          <Link
            href={`/projects/${projectId}?tab=board`}
            className="text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            Manage Board &rarr;
          </Link>
        </div>
      )}
    </footer>
  )
}
