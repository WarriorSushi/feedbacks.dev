'use client'

import { useState } from 'react'

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  if (typeof window !== 'undefined') {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    if (mql.matches !== isMobile) {
      setIsMobile(mql.matches)
    }
  }

  return isMobile
}
