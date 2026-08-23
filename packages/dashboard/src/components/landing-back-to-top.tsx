'use client'

import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LandingBackToTop() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let frame = 0
    const update = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        setVisible(scrollable > 0 && window.scrollY >= scrollable * 0.5)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <button
      data-toast-clearance={visible ? '' : undefined}
      type="button"
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })}
      className={cn(
        'fixed bottom-4 right-4 z-40 grid h-8 w-8 place-items-center rounded-full border border-foreground/10 bg-background/80 text-muted-foreground shadow-[0_10px_28px_-16px_rgb(0_0_0/0.65)] backdrop-blur-md transition-[opacity,transform,color,background-color] duration-300 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        visible ? 'translate-y-0 opacity-80 hover:opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}
