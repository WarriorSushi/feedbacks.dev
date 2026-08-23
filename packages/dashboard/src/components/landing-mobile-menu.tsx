'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

const links = [
  ['#product', 'Product'],
  ['#setup', 'Install'],
  ['#pricing', 'Pricing'],
  ['/early-access', 'Join the Early Adopter Programme'],
  ['/docs', 'Docs'],
] as const

export function LandingMobileMenu() {
  const detailsRef = React.useRef<HTMLDetailsElement>(null)
  const close = () => detailsRef.current?.removeAttribute('open')

  return (
    <details ref={detailsRef} className="relative lg:hidden">
      <summary className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-sm font-medium hover:bg-accent sm:w-auto sm:px-2"><Menu className="h-4 w-4 sm:hidden" /><span className="sr-only sm:not-sr-only">Menu</span></summary>
      <nav className="absolute right-0 top-11 z-50 grid min-w-44 gap-1 rounded-lg border bg-popover p-2 shadow-[var(--shadow-float)]" aria-label="Mobile navigation">
        {links.map(([href, label]) => <Link key={href} onClick={close} className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-accent" href={href} prefetch={href === '/docs' ? false : undefined}>{label}</Link>)}
      </nav>
    </details>
  )
}
