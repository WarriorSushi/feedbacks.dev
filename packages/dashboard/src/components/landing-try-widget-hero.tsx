'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  Bug,
  Camera,
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

const callouts = [
  {
    id: 'top-left',
    path: 'M-20 112 C176 119 336 178 460 306 C544 393 574 449 648 478',
    labelPath: 'M24 118 C184 127 322 174 430 279',
    head: 'M622 459 L648 478 L619 488',
    label: 'Click the button',
    labelOffset: '40%',
  },
  {
    id: 'top-right',
    path: 'M1620 112 C1432 112 1312 177 1192 304 C1122 378 1086 442 952 478',
    labelPath: 'M1188 308 C1312 178 1435 119 1590 116',
    head: 'M980 456 L952 478 L982 489',
    label: 'Press the button',
    labelOffset: '5%',
  },
  {
    id: 'bottom-left',
    path: 'M30 706 C155 618 282 561 408 568 C495 573 561 527 648 510',
    labelPath: 'M58 684 C174 610 286 568 405 574',
    head: 'M620 501 L648 510 L630 534',
    label: 'See the real interaction',
    labelOffset: '46%',
  },
  {
    id: 'bottom-right',
    path: 'M1570 706 C1440 680 1328 618 1217 578 C1118 542 1045 527 960 510',
    labelPath: 'M1010 523 C1100 540 1185 563 1274 602 C1370 644 1462 684 1550 700',
    head: 'M985 493 L960 510 L985 528',
    label: 'The button is the product',
    labelOffset: '15%',
  },
] as const

function HeroAnnotations({ reduceMotion }: { reduceMotion: boolean }) {
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
      <svg className="landing-try-callouts" viewBox="0 0 1600 720" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          {callouts.map((callout) => <path key={callout.id} id={`landing-label-${callout.id}`} d={callout.labelPath} />)}
        </defs>
        {callouts.map((callout, index) => {
          const delay = reduceMotion ? 0 : 0.18 + index * 0.16
          return (
            <g key={callout.id} className="landing-callout-stroke" fill="none" stroke="currentColor">
              <motion.path
                d={callout.path}
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0.35 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 1.05, delay, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d={callout.head}
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.34, delay: delay + 0.74, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.text
                className="landing-callout-path-label"
                dy="-13"
                fill="currentColor"
                stroke="none"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: delay + 0.62 }}
              >
                <textPath href={`#landing-label-${callout.id}`} startOffset={callout.labelOffset}>{callout.label}</textPath>
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
        <AnimatePresence>{!open && <HeroAnnotations reduceMotion={reduceMotion} />}</AnimatePresence>

        <motion.div layout="position" className={cn('landing-try-heading relative z-[2] mx-auto max-w-[920px] text-center', open && 'landing-try-heading-open')} transition={{ layout: { duration: reduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] } }}>
          <h1 id="try-widget-title" className="font-semibold tracking-[-0.055em]">
            <span className="block">We believe in “Show, don&apos;t tell”.</span>
            <span className="mt-1 block text-primary">Your users will press this button.</span>
          </h1>
        </motion.div>

        <motion.div layout="position" className={cn('landing-try-stage relative mx-auto flex min-h-[300px] w-full items-center justify-center', open && 'landing-try-stage-open')} transition={{ layout: { duration: reduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] } }}>
          <div className="landing-try-grid absolute inset-0" aria-hidden="true" />

          <div className="widget-theme-preview contents">
            <AnimatePresence mode="wait" initial={false}>
            {!open && (
              <motion.button
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
                Send feedback
                <MessageSquareText className="h-5 w-5 text-primary" />
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
              className="landing-demo-form relative z-20 w-full max-w-[470px] overflow-hidden rounded-xl border bg-card text-card-foreground shadow-[0_32px_90px_-38px_rgb(0_0_0/0.62)]"
            >
              <div className="flex items-center justify-between gap-5 border-b px-4 py-3">
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
            <motion.div key="success" layoutId="landing-widget-demo" initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }} className="landing-demo-success relative z-20 flex min-h-[390px] w-full max-w-[470px] flex-col items-center justify-center overflow-hidden rounded-xl border bg-card px-6 py-10 text-center shadow-[0_32px_90px_-38px_rgb(0_0_0/0.62)] sm:px-10" aria-live="polite">
              {confetti.map(([left, rotate, delay], index) => <span key={`${left}-${index}`} className={cn('landing-success-confetti', index % 3 === 0 ? 'bg-primary' : index % 3 === 1 ? 'bg-amber-400' : 'bg-sky-400')} style={{ left, rotate, animationDelay: delay }} aria-hidden="true" />)}
              <span className="landing-success-mark relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageSquareText className="h-9 w-9" /></span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">That was the whole thing.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">In a real app, the team would now have your message, page, browser, rating{ screenshotReady ? ', and screenshot' : ''}. Here, it vanished responsibly.</p>
              <button type="button" onClick={launchDemo} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted"><RotateCcw className="h-4 w-4" />Try it again</button>
            </motion.div>
            )}
            </AnimatePresence>
          </div>
        </motion.div>

      </motion.div>
    </section>
  )
}
