import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[68ch] text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  dataTour,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  dataTour?: string
}) {
  return (
    <section data-tour={dataTour} className={cn('overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]', className)}>
      {(title || description || action) && (
        <header className="flex flex-col gap-3 border-b bg-surface-raised/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-1 max-w-[68ch] text-sm leading-5 text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}

export function StatusDot({
  tone = 'neutral',
  className,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  const tones = {
    neutral: 'bg-muted-foreground/55',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-destructive',
    info: 'bg-sky-500',
  }

  return <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tones[tone], className)} />
}

export function CompactSteps({
  steps,
  activeIndex,
  className,
}: {
  steps: Array<{ label: string; href?: string }>
  activeIndex: number
  className?: string
}) {
  return (
    <ol className={cn('flex min-w-0 items-center gap-1 text-xs', className)} aria-label="Setup progress">
      {steps.map((step, index) => {
        const complete = index < activeIndex
        const current = index === activeIndex
        const content = (
          <>
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                complete && 'border-primary bg-primary text-primary-foreground',
                current && 'border-primary bg-primary/10 text-primary',
                !complete && !current && 'border-border bg-surface-raised text-muted-foreground',
              )}
            >
              {complete ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className={cn('truncate font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>
              {step.label}
            </span>
          </>
        )

        return (
          <li key={step.label} className="flex min-w-0 items-center gap-1">
            {index > 0 && <span aria-hidden="true" className="mx-1 h-px w-4 bg-border sm:w-8" />}
            {step.href ? (
              <Link href={step.href} aria-current={current ? 'step' : undefined} className="flex min-w-0 items-center gap-1.5">
                {content}
              </Link>
            ) : (
              <span aria-current={current ? 'step' : undefined} className="flex min-w-0 items-center gap-1.5">
                {content}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
