'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'

const beamPaths = Array.from({ length: 32 }, (_, index) => {
  const x = 20 + index * 44
  const bend = 80 + (index % 7) * 26
  return `M${x} -80 C ${x - bend} 180, ${x + bend} 430, ${x - 20} 880`
})

export function BackgroundBeams({ className = '' }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="early-adopter-beam" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="rgb(132 204 22)" stopOpacity="0" />
            <stop offset="0.38" stopColor="rgb(163 230 53)" stopOpacity="0.55" />
            <stop offset="0.68" stopColor="rgb(45 212 191)" stopOpacity="0.3" />
            <stop offset="1" stopColor="rgb(45 212 191)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="early-adopter-glow">
            <stop stopColor="rgb(132 204 22)" stopOpacity="0.16" />
            <stop offset="1" stopColor="rgb(10 10 12)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="720" cy="440" rx="650" ry="430" fill="url(#early-adopter-glow)" />
        {beamPaths.map((path, index) => (
          <React.Fragment key={path}>
            <path d={path} stroke="rgb(63 63 70)" strokeOpacity="0.24" strokeWidth="0.8" />
            <motion.path
              d={path}
              stroke="url(#early-adopter-beam)"
              strokeWidth="1.35"
              strokeLinecap="round"
              initial={reduceMotion ? { pathLength: 0.35, pathOffset: 0.2, opacity: 0.35 } : { pathLength: 0.08, pathOffset: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { pathLength: [0.08, 0.34, 0.08], pathOffset: [0, 0.65, 1], opacity: [0, 0.7, 0] }}
              transition={{ duration: 8 + (index % 6), delay: index * 0.16, repeat: Infinity, ease: 'linear' }}
            />
          </React.Fragment>
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,12,0.2)_48%,rgba(10,10,12,0.88)_100%)]" />
    </div>
  )
}
