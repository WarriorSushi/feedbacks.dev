import { cn } from '@/lib/utils'

export function Win98Chrome({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn('win98-chrome hidden', className)} aria-hidden="true">
      <span className="win98-chrome-title">{title}</span>
      <span className="win98-chrome-controls">
        <span>_</span>
        <span>□</span>
        <span>×</span>
      </span>
    </div>
  )
}
