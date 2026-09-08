import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandWordmarkProps {
  className?: string
  markClassName?: string
  textClassName?: string
  dotClassName?: string
  markSrc?: string
  markAnchor?: boolean
  priority?: boolean
  intro?: boolean
}

export function BrandWordmark({
  className,
  markClassName,
  textClassName,
  dotClassName,
  markSrc = '/new_logo_feedbacks.dev.svg',
  markAnchor = false,
  priority = false,
  intro = false,
}: BrandWordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        data-pro-brand-anchor={markAnchor ? '' : undefined}
        src={markSrc}
        alt=""
        width={28}
        height={28}
        priority={priority}
        aria-hidden="true"
        className={cn(
          'h-6 w-6 shrink-0 rounded-md object-contain',
          intro && 'animate-fade-in',
          markClassName,
        )}
      />
      <span className={cn('tracking-tight', intro && 'animate-fade-in', textClassName)}>
        feedbacks<span className={cn('text-[oklch(var(--brand))]', dotClassName)}>.dev</span>
      </span>
    </span>
  )
}
