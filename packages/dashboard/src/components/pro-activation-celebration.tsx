'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import {
  PRO_ACTIVATED_EVENT,
  PRO_CELEBRATION_COMPLETE_EVENT,
  PRO_CELEBRATION_STARTED_EVENT,
} from '@/lib/pro-activation'

const HOLD_MS = 3_000
const FLIGHT_MS = 900
const DISPLAY_MS = HOLD_MS + FLIGHT_MS
const PRO_MARK_SIZE = 176
const PRO_MARK_MOBILE_SIZE = 144
const CONFETTI_COLORS = ['#b6f446', '#f8fafc', '#6fa91e', '#f4c95d', '#b69cff', '#58d6c7']
const CONFETTI = Array.from({ length: 36 }, (_, index) => {
  const angle = ((index * 137.5) % 360) * (Math.PI / 180)
  const distance = 150 + ((index * 29) % 260)
  return {
    id: index,
    x: Math.cos(angle) * distance,
    lift: -80 - ((index * 23) % 150),
    y: Math.sin(angle) * distance * 0.35 + 220 + ((index * 17) % 160),
    delay: (index % 9) * 0.035,
    duration: 2.1 + (index % 6) * 0.12,
    rotate: 180 + ((index * 71) % 420),
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: index % 4 === 0,
  }
})

interface ProActivationCelebrationProps {
  userId: string
  active: boolean
  activationKey: string | null
}

interface FlightTarget {
  x: number
  y: number
  scale: number
  targetX: number
  targetY: number
}

function findBrandTarget() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-pro-brand-anchor]'))
    .map((element) => element.getBoundingClientRect())
    .find((rect) => rect.width > 0 && rect.height > 0)
}

function fallbackBrandTarget() {
  return {
    left: 18,
    top: 18,
    width: 24,
    height: 24,
  }
}

export function ProActivationCelebration({ userId, active, activationKey }: ProActivationCelebrationProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [visibleKey, setVisibleKey] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<'holding' | 'flying'>('holding')
  const [loadedAssets, setLoadedAssets] = React.useState(0)
  const [flight, setFlight] = React.useState<FlightTarget>({
    x: 0,
    y: 0,
    scale: 0.14,
    targetX: 30,
    targetY: 30,
  })
  const markRef = React.useRef<HTMLDivElement>(null)
  const activeKeyRef = React.useRef<string | null>(null)
  const holdTimerRef = React.useRef<number | null>(null)
  const finishTimerRef = React.useRef<number | null>(null)
  const seenKey = `feedbacks:seen-pro-activation:${userId}`

  const clearTimers = React.useCallback(() => {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
    holdTimerRef.current = null
    finishTimerRef.current = null
  }, [])

  const complete = React.useCallback((key: string) => {
    if (activeKeyRef.current !== key) return
    clearTimers()
    try {
      window.localStorage.setItem(seenKey, key)
    } catch {
      // The celebration can still finish when storage is unavailable.
    }
    activeKeyRef.current = null
    setVisibleKey(null)
    setPhase('holding')
    window.dispatchEvent(new CustomEvent(PRO_CELEBRATION_COMPLETE_EVENT))
  }, [clearTimers, seenKey])

  const startFlight = React.useCallback((key: string) => {
    if (activeKeyRef.current !== key) return
    if (reduceMotion) {
      complete(key)
      return
    }

    const source = markRef.current?.getBoundingClientRect()
    const target = findBrandTarget() || fallbackBrandTarget()
    const sourceCenterX = source ? source.left + source.width / 2 : window.innerWidth / 2
    const sourceCenterY = source ? source.top + source.height / 2 : window.innerHeight * 0.4
    const sourceWidth = source?.width || (window.innerWidth < 640 ? PRO_MARK_MOBILE_SIZE : PRO_MARK_SIZE)
    setFlight({
      x: target.left + target.width / 2 - sourceCenterX,
      y: target.top + target.height / 2 - sourceCenterY,
      scale: Math.max(0.1, target.width / sourceWidth),
      targetX: target.left + target.width / 2,
      targetY: target.top + target.height / 2,
    })
    setPhase('flying')
    finishTimerRef.current = window.setTimeout(() => complete(key), FLIGHT_MS + 250)
  }, [complete, reduceMotion])

  const reveal = React.useCallback((key: string) => {
    if (activeKeyRef.current) return
    clearTimers()
    activeKeyRef.current = key
    setLoadedAssets(0)
    setPhase('holding')
    setVisibleKey(key)
    window.dispatchEvent(new CustomEvent(PRO_CELEBRATION_STARTED_EVENT))
  }, [clearTimers])

  React.useEffect(() => {
    if (!visibleKey || loadedAssets !== 3 || holdTimerRef.current) return
    holdTimerRef.current = window.setTimeout(() => startFlight(visibleKey), HOLD_MS)
  }, [loadedAssets, startFlight, visibleKey])

  React.useEffect(() => {
    if (!active || !activationKey) return
    try {
      if (window.localStorage.getItem(seenKey) === activationKey) return
    } catch {
      // Show once for this mounted state when storage is unavailable.
    }
    reveal(activationKey)
  }, [activationKey, active, reveal, seenKey])

  React.useEffect(() => {
    const handleActivation = (event: Event) => {
      const detail = (event as CustomEvent<{ activationKey?: string }>).detail
      reveal(detail?.activationKey || `pro:${Date.now()}`)
    }
    window.addEventListener(PRO_ACTIVATED_EVENT, handleActivation)
    return () => window.removeEventListener(PRO_ACTIVATED_EVENT, handleActivation)
  }, [reveal])

  React.useEffect(() => () => clearTimers(), [clearTimers])

  if (!visibleKey) return null

  const assetsReady = loadedAssets === 3
  const clipPath = phase === 'flying'
    ? `circle(0px at ${flight.targetX}px ${flight.targetY}px)`
    : 'circle(150vmax at 50% 40%)'

  return (
    <div
      data-pro-celebration
      data-pro-celebration-phase={phase}
      data-pro-celebration-duration={DISPLAY_MS}
      data-pro-celebration-ready={assetsReady ? 'true' : 'false'}
      className="fixed inset-0 z-[120] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Pro is active"
    >
      <motion.div
        className="absolute inset-0 overflow-hidden bg-background"
        initial={false}
        animate={{ clipPath }}
        transition={phase === 'flying'
          ? { duration: FLIGHT_MS / 1000, ease: [0.76, 0, 0.24, 1] }
          : { duration: 0 }}
        style={{
          background:
            'radial-gradient(circle at 50% 38%, oklch(var(--primary) / 0.2), transparent 30%), radial-gradient(circle at 14% 16%, oklch(var(--accent) / 0.72), transparent 32%), radial-gradient(circle at 88% 78%, oklch(var(--primary) / 0.12), transparent 36%), linear-gradient(145deg, oklch(var(--background)), oklch(var(--muted) / 0.82))',
        }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(oklch(var(--foreground)/0.035)_1px,transparent_1px),linear-gradient(90deg,oklch(var(--foreground)/0.035)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_72%)]" />

        {assetsReady && !reduceMotion ? CONFETTI.map((piece) => (
          <motion.span
            key={piece.id}
            aria-hidden="true"
            className={piece.round ? 'absolute left-1/2 top-[40%] h-2.5 w-2.5 rounded-full' : 'absolute left-1/2 top-[40%] h-3.5 w-2 rounded-[2px]'}
            style={{ backgroundColor: piece.color }}
            initial={{ x: 0, y: 0, rotate: 0, scale: 0.7, opacity: 1 }}
            animate={{
              x: piece.x,
              y: [0, piece.lift, piece.y],
              rotate: piece.rotate,
              scale: [0.7, 1, 1, 0.85],
              opacity: [1, 1, 1, 0],
            }}
            transition={{
              delay: piece.delay,
              duration: piece.duration,
              ease: [0.22, 0.78, 0.28, 1],
              times: [0, 0.28, 0.82, 1],
            }}
          />
        )) : null}

        <motion.div
          aria-hidden="true"
          className={`absolute left-[calc(50%+46px)] top-[calc(40%-10px)] z-20 h-28 w-28 sm:left-[calc(50%+82px)] sm:top-[calc(40%-34px)] sm:h-40 sm:w-40 ${assetsReady ? 'visible' : 'invisible'}`}
          initial={reduceMotion ? false : { y: 18, scale: 0.82, rotate: 5 }}
          animate={{ y: 0, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 210, damping: 18, mass: 0.9, delay: 0.12 }}
        >
          <Image
            src="/mascots-v2/final-victory.png"
            alt=""
            fill
            sizes="(max-width: 639px) 112px, 160px"
            className="object-contain drop-shadow-[0_22px_28px_rgb(0_0_0/0.2)]"
            priority
            onLoad={() => setLoadedAssets((value) => value | 1)}
            onError={() => setLoadedAssets((value) => value | 1)}
          />
        </motion.div>

        <motion.div
          className={`absolute inset-x-5 top-[calc(40%+104px)] z-10 mx-auto max-w-xl text-center sm:top-[calc(40%+128px)] ${assetsReady ? 'visible' : 'invisible'}`}
          initial={reduceMotion ? false : { y: 16, scale: 0.97 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 190, damping: 22, delay: 0.08 }}
        >
          <p className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Welcome to Pro.</p>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">Every Pro feature is unlocked and ready for you.</p>
          {!reduceMotion ? (
            <div aria-hidden="true" className="mx-auto mt-6 h-1 w-52 overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                className="h-full origin-left rounded-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: HOLD_MS / 1000, ease: 'linear' }}
              />
            </div>
          ) : null}
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute left-1/2 top-[40%] z-30 h-0 w-0">
        <motion.div
          ref={markRef}
          aria-hidden="true"
          className={`relative -ml-[72px] -mt-[72px] h-36 w-36 sm:-ml-[88px] sm:-mt-[88px] sm:h-44 sm:w-44 ${assetsReady ? 'visible' : 'invisible'}`}
          initial={reduceMotion ? false : { scale: 0.76, y: 14 }}
          animate={phase === 'flying'
            ? { x: flight.x, y: flight.y, scale: flight.scale }
            : { x: 0, y: 0, scale: 1 }}
          transition={phase === 'flying'
            ? { duration: FLIGHT_MS / 1000, ease: [0.76, 0, 0.24, 1] }
            : { type: 'spring', stiffness: 230, damping: 20, mass: 0.85 }}
          onAnimationComplete={() => {
            if (phase === 'flying') complete(visibleKey)
          }}
        >
          <div className="absolute -inset-5 rounded-[2.25rem] bg-primary/15 blur-2xl" />
          <Image
            src="/feedbacks.dev_pro_monthly.svg"
            alt=""
            fill
            sizes="(max-width: 639px) 144px, 176px"
            className="relative object-contain drop-shadow-[0_24px_44px_rgb(0_0_0/0.3)]"
            priority
            onLoad={() => setLoadedAssets((value) => value | 2)}
            onError={() => setLoadedAssets((value) => value | 2)}
          />
        </motion.div>
      </div>
    </div>
  )
}
