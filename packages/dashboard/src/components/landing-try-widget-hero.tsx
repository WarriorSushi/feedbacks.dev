'use client'

import * as React from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  Bug,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedbackType = 'bug' | 'idea' | 'praise' | 'question'

const typedMessage = "I love this app, and I can't wait to tell my friends about it."

const feedbackTypes: { value: FeedbackType; label: string; Icon: typeof Bug }[] = [
  { value: 'bug', label: 'Bug', Icon: Bug },
  { value: 'idea', label: 'Idea', Icon: Lightbulb },
  { value: 'praise', label: 'Praise', Icon: Sparkles },
  { value: 'question', label: 'Question', Icon: CircleHelp },
]

const confetti = [
  ['8%', '-12deg', '0ms'], ['15%', '18deg', '80ms'], ['24%', '42deg', '160ms'],
  ['35%', '-28deg', '220ms'], ['46%', '12deg', '60ms'], ['57%', '38deg', '180ms'],
  ['68%', '-16deg', '120ms'], ['78%', '24deg', '260ms'], ['90%', '-34deg', '200ms'],
] as const

type AnnotationGeometry = {
  width: number
  height: number
  buttonLeft: number
  buttonRight: number
  buttonTop: number
  buttonBottom: number
}

function HeroAnnotations({
  reduceMotion,
  stageRef,
  buttonRef,
}: {
  reduceMotion: boolean
  stageRef: React.RefObject<HTMLDivElement | null>
  buttonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const [geometry, setGeometry] = React.useState<AnnotationGeometry | null>(null)

  React.useLayoutEffect(() => {
    let frame = 0
    let observer: ResizeObserver | null = null

    const connect = () => {
      const stage = stageRef.current
      const button = buttonRef.current
      if (!stage || !button) {
        frame = window.requestAnimationFrame(connect)
        return
      }

      const measure = () => {
      const stageBox = stage.getBoundingClientRect()
      const buttonBox = button.getBoundingClientRect()
      setGeometry({
        width: stageBox.width,
        height: stageBox.height,
        buttonLeft: buttonBox.left - stageBox.left,
        buttonRight: buttonBox.right - stageBox.left,
        buttonTop: buttonBox.top - stageBox.top,
        buttonBottom: buttonBox.bottom - stageBox.top,
      })
      }

      measure()
      observer = new ResizeObserver(measure)
      observer.observe(stage)
      observer.observe(button)
    }

    connect()
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [buttonRef, stageRef])

  if (!geometry) return null

  const { width, height, buttonLeft, buttonRight, buttonTop, buttonBottom } = geometry
  const leftTarget = Math.max(0, buttonLeft - 14)
  const rightTarget = Math.min(width, buttonRight + 14)
  const centerY = (buttonTop + buttonBottom) / 2
  const paths = [
    {
      id: 'top-left',
      d: `M 0 ${height * 0.14} C ${width * 0.12} ${height * 0.13}, ${width * 0.18} ${height * 0.09}, ${width * 0.27} ${height * 0.18} C ${width * 0.34} ${height * 0.24}, ${width * 0.37} ${height * 0.32}, ${leftTarget} ${centerY - 12}`,
      textD: `M 0 ${height * 0.14} C ${width * 0.12} ${height * 0.13}, ${width * 0.18} ${height * 0.09}, ${width * 0.27} ${height * 0.18} C ${width * 0.34} ${height * 0.24}, ${width * 0.37} ${height * 0.32}, ${leftTarget} ${centerY - 12}`,
      label: 'Feedback starts right here',
      startOffset: '8%',
    },
    {
      id: 'top-right',
      d: `M ${width} ${height * 0.12} C ${width * 0.85} ${height * 0.11}, ${width * 0.82} ${height * 0.2}, ${width * 0.73} ${height * 0.18} C ${width * 0.65} ${height * 0.16}, ${width * 0.64} ${height * 0.33}, ${rightTarget} ${centerY - 12}`,
      textD: `M ${rightTarget} ${centerY - 12} C ${width * 0.64} ${height * 0.33}, ${width * 0.65} ${height * 0.16}, ${width * 0.73} ${height * 0.18} C ${width * 0.82} ${height * 0.2}, ${width * 0.85} ${height * 0.11}, ${width} ${height * 0.12}`,
      label: 'No support portal required',
      startOffset: '42%',
    },
    {
      id: 'bottom-left',
      d: `M 0 ${height * 0.9} C ${width * 0.11} ${height * 0.77}, ${width * 0.18} ${height * 0.82}, ${width * 0.27} ${height * 0.74} C ${width * 0.36} ${height * 0.66}, ${width * 0.34} ${height * 0.55}, ${leftTarget} ${centerY + 12}`,
      textD: `M 0 ${height * 0.9} C ${width * 0.11} ${height * 0.77}, ${width * 0.18} ${height * 0.82}, ${width * 0.27} ${height * 0.74} C ${width * 0.36} ${height * 0.66}, ${width * 0.34} ${height * 0.55}, ${leftTarget} ${centerY + 12}`,
      label: 'Your customer stays on the page',
      startOffset: '7%',
    },
    {
      id: 'bottom-right',
      d: `M ${width} ${height * 0.89} C ${width * 0.88} ${height * 0.82}, ${width * 0.82} ${height * 0.71}, ${width * 0.73} ${height * 0.74} C ${width * 0.66} ${height * 0.76}, ${width * 0.64} ${height * 0.58}, ${rightTarget} ${centerY + 12}`,
      textD: `M ${rightTarget} ${centerY + 12} C ${width * 0.64} ${height * 0.58}, ${width * 0.66} ${height * 0.76}, ${width * 0.73} ${height * 0.74} C ${width * 0.82} ${height * 0.71}, ${width * 0.88} ${height * 0.82}, ${width} ${height * 0.89}`,
      label: 'Page and browser context come along',
      startOffset: '40%',
    },
  ]

  return (
    <motion.div
      className="landing-try-annotations absolute inset-0"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: reduceMotion ? 0 : 0.32 }}
      aria-hidden="true"
    >
      <span className="landing-try-halo landing-try-halo-left" />
      <span className="landing-try-halo landing-try-halo-right" />
      <svg className="landing-try-callouts" viewBox={`0 0 ${width} ${height}`} fill="none" preserveAspectRatio="none">
        <defs>
          <marker id="landing-arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </marker>
          {paths.map((callout) => <path key={`${callout.id}-text-path`} id={`landing-${callout.id}-text-path`} d={callout.textD} />)}
        </defs>
        {paths.map((callout, index) => {
          const delay = reduceMotion ? 0 : 0.18 + index * 0.16
          return (
            <g key={callout.id} className="landing-callout-stroke" fill="none" stroke="currentColor">
              <motion.path
                className="landing-callout-line"
                d={callout.d}
                initial={reduceMotion ? false : { opacity: 0, strokeDashoffset: 48 }}
                animate={{ opacity: 1, strokeDashoffset: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                className="landing-callout-arrowhead"
                d={callout.d}
                markerEnd="url(#landing-arrowhead)"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : delay + 0.9 }}
              />
              <motion.text
                className="landing-callout-path-label"
                dy="-9"
                fill="currentColor"
                stroke="none"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: delay + 0.62 }}
              >
                <textPath href={`#landing-${callout.id}-text-path`} startOffset={callout.startOffset}>{callout.label}</textPath>
              </motion.text>
            </g>
          )
        })}
      </svg>
    </motion.div>
  )
}

export function LandingTryWidgetHero() {
  const [open, setOpen] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>('praise')
  const [rating, setRating] = React.useState(0)
  const [screenshotReady, setScreenshotReady] = React.useState(false)
  const reduceMotion = useReducedMotion() ?? false
  const sectionRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const launchButtonRef = React.useRef<HTMLButtonElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const userEdited = React.useRef(false)
  const userRated = React.useRef(false)

  React.useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
    const settle = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      closeButtonRef.current?.focus({ preventScroll: true })
    }, reduceMotion ? 0 : 640)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settle)
    }
  }, [open, reduceMotion])

  React.useEffect(() => {
    if (!open || submitted) return
    if (reduceMotion) {
      if (!userEdited.current) setMessage(typedMessage)
      if (!userRated.current) setRating(5)
      return
    }

    let character = 0
    const typingTimer = window.setInterval(() => {
      if (userEdited.current) return window.clearInterval(typingTimer)
      character += 1
      setMessage(typedMessage.slice(0, character))
      if (character >= typedMessage.length) window.clearInterval(typingTimer)
    }, 34)

    let star = 0
    const starTimer = window.setInterval(() => {
      if (userRated.current) return window.clearInterval(starTimer)
      star += 1
      setRating(star)
      if (star >= 5) window.clearInterval(starTimer)
    }, 260)

    return () => {
      window.clearInterval(typingTimer)
      window.clearInterval(starTimer)
    }
  }, [open, reduceMotion, submitted])

  React.useEffect(() => {
    if (!submitted) return
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [submitted])

  const launchDemo = () => {
    setOpen(true)
    setSubmitted(false)
    setMessage('')
    setRating(0)
    setFeedbackType('praise')
    setScreenshotReady(false)
    userEdited.current = false
    userRated.current = false
  }

  const closeDemo = () => {
    setOpen(false)
    setSubmitted(false)
  }

  return (
    <section ref={sectionRef} className="landing-try-hero relative isolate overflow-hidden border-b" aria-labelledby="try-widget-title">
      <motion.div layout className={cn('landing-try-shell relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1600px] flex-col px-5 pb-8 sm:px-6', open && 'landing-try-shell-open')} transition={{ layout: { duration: reduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] } }}>
        <motion.div layout="position" className={cn('landing-try-heading relative z-[2] mx-auto max-w-[920px] text-center', open && 'landing-try-heading-open')} transition={{ layout: { duration: reduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] } }}>
          <h1 id="try-widget-title" className="font-semibold tracking-[-0.055em]">
            <span className="block">We believe in “Show, don&apos;t tell”.</span>
            <span className="mt-1 block text-primary">Your users will press this button.</span>
          </h1>
        </motion.div>

        <motion.div ref={stageRef} layout="position" className={cn('landing-try-stage relative mx-auto flex min-h-[300px] w-full flex-col items-center justify-center', open && 'landing-try-stage-open')} transition={{ layout: { duration: reduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] } }}>
          <div className="landing-try-grid absolute inset-0" aria-hidden="true" />
          <Image className={cn('landing-section-mascot landing-mascot-hero', open && 'is-hidden')} src="/mascots-v2/hero-bungee.png" alt="" width={1024} height={1536} sizes="(max-width: 767px) 96px, 230px" priority aria-hidden="true" />
          <AnimatePresence>{!open && <HeroAnnotations reduceMotion={reduceMotion} stageRef={stageRef} buttonRef={launchButtonRef} />}</AnimatePresence>

          <div className="widget-theme-preview contents">
            <AnimatePresence mode="wait" initial={false}>
            {!open && (
              <motion.button
                ref={launchButtonRef}
                key="launch"
                layoutId="landing-widget-demo"
                type="button"
                onClick={launchDemo}
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { y: -1, scale: 0.985 }}
                transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="landing-try-launch group relative z-10 inline-flex min-h-16 items-center gap-3 rounded-full px-8 text-base font-semibold transition-[box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 sm:min-h-20 sm:px-11 sm:text-lg"
              >
                <span className="landing-try-radiation landing-try-radiation-one" aria-hidden="true" />
                <span className="landing-try-radiation landing-try-radiation-two" aria-hidden="true" />
                <span className="landing-try-radiation landing-try-radiation-three" aria-hidden="true" />
                <span className="relative z-[1]">Send feedback</span>
                <MessageSquareText className="relative z-[1] h-5 w-5 text-primary" />
              </motion.button>
            )}

            {open && !submitted && (
            <motion.div
              key="form"
              layoutId="landing-widget-demo"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
              className="landing-app-window landing-demo-form relative z-20 w-full max-w-[470px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-[0_32px_90px_-38px_rgb(0_0_0/0.62)]"
            >
              <div className="landing-window-titlebar flex items-center justify-between gap-5 border-b px-4 py-3">
                <p className="text-sm font-semibold">Send feedback</p>
                <button ref={closeButtonRef} type="button" onClick={closeDemo} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:w-8" aria-label="Close demo feedback form"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-3.5 p-4">
                <fieldset>
                  <legend className="mb-1.5 text-[11px] font-semibold">What kind of feedback?</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {feedbackTypes.map(({ value, label, Icon }) => (
                      <button key={value} type="button" onClick={() => setFeedbackType(value)} aria-pressed={feedbackType === value} className={cn('inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 sm:min-h-9', feedbackType === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}><Icon className="h-3.5 w-3.5" />{label}</button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="landing-demo-message" className="mb-1.5 block text-[11px] font-semibold">Your message</label>
                  <div className="relative">
                    <textarea
                      id="landing-demo-message"
                      value={message}
                      onChange={(event) => { userEdited.current = true; setMessage(event.target.value) }}
                      onFocus={() => { userEdited.current = true }}
                      rows={3}
                      className="min-h-20 w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm leading-5 outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {!userEdited.current && message.length < typedMessage.length && <span className="landing-type-caret" aria-hidden="true" />}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 border-t pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold">How was it?</p>
                    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button key={value} type="button" onClick={() => { userRated.current = true; setRating(value) }} aria-label={`Rate ${value} stars`} className="inline-flex h-10 w-10 items-center justify-center rounded text-amber-400 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-8 sm:w-8"><Star className={cn('h-5 w-5', value <= rating && 'fill-current')} /></button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => setScreenshotReady((ready) => !ready)} aria-pressed={screenshotReady} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors sm:min-h-9', screenshotReady ? 'border-primary/40 bg-primary/10 text-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}><Camera className="h-3.5 w-3.5" />{screenshotReady ? 'Screenshot ready' : 'Add screenshot'}</button>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-3.5">
                  <p className="text-[11px] text-muted-foreground">Page + browser context included</p>
                  <button type="button" disabled={!message.trim()} onClick={() => setSubmitted(true)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9">Send <ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </motion.div>
            )}

            {open && submitted && (
            <motion.div key="success" layoutId="landing-widget-demo" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }} className="landing-app-window landing-demo-success relative z-20 flex min-h-[390px] w-full max-w-[470px] flex-col items-center justify-center overflow-hidden rounded-xl border bg-card px-6 py-10 text-center shadow-[0_32px_90px_-38px_rgb(0_0_0/0.62)] sm:px-10" aria-live="polite">
              <div className="landing-window-chrome">feedbacks.dev</div>
              {confetti.map(([left, rotate, delay], index) => <span key={`${left}-${index}`} className={cn('landing-success-confetti', index % 3 === 0 ? 'bg-primary' : index % 3 === 1 ? 'bg-amber-400' : 'bg-sky-400')} style={{ left, rotate, animationDelay: delay }} aria-hidden="true" />)}
              <span className="landing-success-mark relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageSquareText className="h-9 w-9" /></span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">Feedback received.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">The team gets your message, page, browser, rating{ screenshotReady ? ', and screenshot' : ''} together, ready to review.</p>
              <button type="button" onClick={launchDemo} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted"><RotateCcw className="h-4 w-4" />Try it again</button>
            </motion.div>
            )}
            </AnimatePresence>
          </div>

          {open && (
            <motion.button
              type="button"
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.3 }}
              className="landing-scroll-cue relative z-20 mt-6 inline-flex min-h-16 flex-col items-center justify-center gap-2 rounded-full px-8 text-base font-semibold tracking-[-0.02em] text-foreground/80 transition-colors hover:text-foreground sm:mt-16 sm:min-h-20 sm:text-xl"
            >
              <span>{submitted ? 'See the complete feedback loop' : 'Scroll below when ready'}</span>
              <ChevronDown className="h-7 w-7" />
            </motion.button>
          )}
        </motion.div>

      </motion.div>
    </section>
  )
}
