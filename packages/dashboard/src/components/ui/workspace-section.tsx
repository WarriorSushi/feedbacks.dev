import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WorkspaceSectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  tone?: 'default' | 'danger'
}

export function WorkspaceSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  tone = 'default',
}: WorkspaceSectionProps) {
  return (
    <section
      className={cn(
        'workspace-panel win98-window overflow-hidden rounded-lg border bg-card text-card-foreground shadow-[var(--shadow-card)]',
        tone === 'danger' && 'border-destructive/35',
        className,
      )}
    >
      <header
        className={cn(
          'win98-titlebar flex flex-col gap-3 border-b bg-surface-raised/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between',
          tone === 'danger' && 'border-destructive/25 bg-destructive/[0.045]',
        )}
      >
        <div>
          <h3 className={cn('text-base font-semibold', tone === 'danger' && 'text-destructive')}>{title}</h3>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn('space-y-5 p-5 sm:p-6', contentClassName)}>{children}</div>
    </section>
  )
}
