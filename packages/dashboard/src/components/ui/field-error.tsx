import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FieldError({ id, children, className }: { id: string; children?: React.ReactNode; className?: string }) {
  if (!children) return null

  return (
    <p id={id} role="alert" className={cn('flex items-start gap-1.5 text-xs font-medium text-destructive', className)}>
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

export function FormErrorSummary({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null

  return (
    <div role="alert" aria-live="assertive" className={cn('rounded-md border border-destructive/35 bg-destructive/[0.07] px-3 py-2.5 text-sm text-destructive', className)}>
      {children}
    </div>
  )
}
