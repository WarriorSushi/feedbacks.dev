import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  detail,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
  detail?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('workspace-empty-state relative isolate overflow-hidden rounded-xl border bg-card px-5 py-12 text-center shadow-[var(--shadow-card)] sm:px-8 sm:py-14', className)}>
      <span className="workspace-empty-icon mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
      {detail ? <div className="mx-auto mt-5 max-w-md text-xs leading-5 text-muted-foreground">{detail}</div> : null}
    </section>
  )
}
