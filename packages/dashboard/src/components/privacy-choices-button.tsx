'use client'

import { cn } from '@/lib/utils'

export function PrivacyChoicesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn('hover:text-foreground', className)}
      onClick={() => window.dispatchEvent(new Event('feedbacks:open-privacy-choices'))}
    >
      Privacy choices
    </button>
  )
}
