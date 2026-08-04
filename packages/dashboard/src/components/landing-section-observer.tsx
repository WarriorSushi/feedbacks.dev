'use client'

import * as React from 'react'

export function LandingSectionObserver() {
  React.useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.landing-reveal'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || !('IntersectionObserver' in window)) {
      sections.forEach((section) => { section.dataset.visible = 'true' })
      return
    }

    sections.forEach((section) => { section.dataset.motionReady = 'true' })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const section = entry.target as HTMLElement
        section.dataset.visible = 'true'
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return null
}
