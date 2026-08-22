'use client'

import * as React from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  PRO_ACTIVATED_EVENT,
  PRO_CELEBRATION_COMPLETE_EVENT,
  PRO_CELEBRATION_STARTED_EVENT,
} from '@/lib/pro-activation'

const DISPLAY_MS = 3_000
const RECENT_CELEBRATION_MS = 60_000
const CONFETTI = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${4 + ((index * 37) % 92)}%`,
  delay: (index % 10) * 0.045,
  duration: 1.35 + (index % 5) * 0.16,
  rotate: 100 + ((index * 53) % 260),
  color: ['#b6f446', '#ffffff', '#6fa91e', '#f4c95d', '#b69cff'][index % 5],
}))

interface ProActivationCelebrationProps {
  userId: string
  active: boolean
  activationKey: string | null
}

function findBrandTarget() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-pro-brand-anchor]'))
    .map((element) => element.getBoundingClientRect())
    .find((rect) => rect.width > 0 && rect.height > 0)
}

export function ProActivationCelebration({ userId, active, activationKey }: ProActivationCelebrationProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [visibleKey, setVisibleKey] = React.useState<string | null>(null)
  const [flight, setFlight] = React.useState({ x: 0, y: 0 })
  const timerRef = React.useRef<number | null>(null)
  const seenKey = `feedbacks:seen-pro-activation:${userId}`
  const recentKey = `feedbacks:last-pro-celebration:${userId}`

  const reveal = React.useCallback((key: string) => {
    window.dispatchEvent(new CustomEvent(PRO_CELEBRATION_STARTED_EVENT))
    try {
      window.localStorage.setItem(seenKey, key)
      window.localStorage.setItem(recentKey, String(Date.now()))
    } catch {
      // The celebration can still run when storage is unavailable.
    }

    const target = findBrandTarget()
    setFlight(target
      ? { x: target.left + target.width / 2 - window.innerWidth / 2, y: target.top + target.height / 2 - window.innerHeight / 2 }
      : { x: 30 - window.innerWidth / 2, y: 30 - window.innerHeight / 2 })
    setVisibleKey(key)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setVisibleKey(null)
      window.dispatchEvent(new CustomEvent(PRO_CELEBRATION_COMPLETE_EVENT))
    }, reduceMotion ? 1_800 : DISPLAY_MS)
  }, [recentKey, reduceMotion, seenKey])

  React.useEffect(() => {
    if (!active || !activationKey) return
    try {
      const alreadySeen = window.localStorage.getItem(seenKey)
      if (alreadySeen === activationKey) return
      const lastCelebration = Number(window.localStorage.getItem(recentKey) || 0)
      if (Date.now() - lastCelebration < RECENT_CELEBRATION_MS) {
        window.localStorage.setItem(seenKey, activationKey)
        return
      }
    } catch {
      // Show once for this mounted state when storage is unavailable.
    }
    reveal(activationKey)
  }, [activationKey, active, recentKey, reveal, seenKey])

  React.useEffect(() => {
    const handleActivation = (event: Event) => {
      const detail = (event as CustomEvent<{ activationKey?: string }>).detail
      reveal(detail?.activationKey || `pro:${Date.now()}`)
    }
    window.addEventListener(PRO_ACTIVATED_EVENT, handleActivation)
    return () => window.removeEventListener(PRO_ACTIVATED_EVENT, handleActivation)
  }, [reveal])

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  return (
    <AnimatePresence>
      {visibleKey ? (
        <motion.div
          key={visibleKey}
          data-pro-celebration
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          role="status"
          aria-live="polite"
          aria-label="Pro is active"
        >
          <motion.div
            className="absolute inset-0 bg-background/88 backdrop-blur-sm"
            animate={reduceMotion ? undefined : { opacity: [1, 1, 0] }}
            transition={{ duration: 2.9, times: [0, 0.68, 1], ease: [0.16, 1, 0.3, 1] }}
          />

          {!reduceMotion && CONFETTI.map((piece) => (
            <motion.span
              key={piece.id}
              aria-hidden="true"
              className="absolute top-[-18px] h-3 w-1.5 rounded-[1px]"
              style={{ left: piece.left, backgroundColor: piece.color }}
              initial={{ y: -20, rotate: 0, opacity: 0 }}
              animate={{ y: '105vh', rotate: piece.rotate, opacity: [0, 1, 1, 0] }}
              transition={{ delay: piece.delay, duration: piece.duration, ease: [0.2, 0.8, 0.3, 1] }}
            />
          ))}

          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-[50%] z-10 -ml-[72px] -mt-[72px] h-36 w-36 sm:-ml-[88px] sm:-mt-[88px] sm:h-44 sm:w-44"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.55 }}
            animate={reduceMotion ? { opacity: 1 } : {
              x: [0, 0, 0, flight.x, flight.x],
              y: [0, 0, 0, flight.y, flight.y],
              scale: [0.55, 1, 1, 0.16, 0.16],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{ duration: 2.85, times: [0, 0.14, 0.61, 0.91, 1], ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/feedbacks.dev_pro_monthly.png" alt="" fill sizes="176px" className="object-contain drop-shadow-[0_22px_40px_rgb(0_0_0/0.28)]" priority />
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="absolute left-[calc(50%+64px)] top-[calc(50%+40px)] z-20 h-36 w-36 sm:left-[calc(50%+84px)] sm:h-48 sm:w-48"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.92 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0], y: [20, 0, 0, -10], scale: [0.92, 1, 1, 0.96] }}
            transition={{ duration: 2.35, times: [0, 0.18, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/mascots-v2/final-victory.png" alt="" fill sizes="192px" className="object-contain" />
          </motion.div>

          <motion.div
            className="absolute inset-x-0 top-[calc(50%+104px)] z-10 mx-auto w-[min(90vw,420px)] text-center sm:top-[calc(50%+124px)]"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
            transition={{ duration: 2.35, times: [0, 0.18, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Pro is active.</p>
            <p className="mt-1 text-sm text-muted-foreground">Your dashboard is now fully unlocked.</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
