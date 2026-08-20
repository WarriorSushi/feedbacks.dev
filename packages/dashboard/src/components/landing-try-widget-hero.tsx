'use client'

import * as React from 'react'
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

function HeroAnnotations() {
  return (
    <div className="landing-try-annotations absolute inset-0" aria-hidden="true">
      <span className="landing-try-halo landing-try-halo-left" />
      <span className="landing-try-halo landing-try-halo-right" />
      <svg className="landing-try-callouts" viewBox="0 0 1600 720" fill="none" preserveAspectRatio="none">
        <g className="landing-callout-stroke landing-callout-one">
          <path pathLength="1" d="M-28 76 C150 80 278 134 372 230 C456 316 482 387 594 435" />
          <path pathLength="1" d="M570 412 L594 435 L564 441" />
        </g>
        <g className="landing-callout-stroke landing-callout-two">
          <path pathLength="1" d="M1628 80 C1462 70 1342 123 1261 225 C1198 304 1172 381 1076 433" />
          <path pathLength="1" d="M1087 405 L1076 433 L1105 418" />
        </g>
        <g className="landing-callout-stroke landing-callout-three">
          <path pathLength="1" d="M48 704 C139 615 218 563 303 550 C394 536 469 588 594 526" />
          <path pathLength="1" d="M570 519 L594 526 L580 550" />
        </g>
        <g className="landing-callout-stroke landing-callout-four">
          <path pathLength="1" d="M1553 698 C1458 681 1383 645 1312 600 C1247 559 1187 537 1096 520" />
          <path pathLength="1" d="M1118 505 L1096 520 L1117 536" />
        </g>
        <g className="landing-callout-dots">
          <circle cx="156" cy="100" r="4.25" /><circle cx="286" cy="170" r="4.25" />
          <circle cx="1450" cy="96" r="4.25" /><circle cx="1324" cy="159" r="4.25" />
          <circle cx="153" cy="614" r="4.25" /><circle cx="269" cy="556" r="4.25" />
          <circle cx="1460" cy="666" r="4.25" /><circle cx="1364" cy="626" r="4.25" />
        </g>
      </svg>
      <span className="landing-callout-label landing-callout-label-one">Click the button</span>
      <span className="landing-callout-label landing-callout-label-two">Press the button</span>
      <span className="landing-callout-label landing-callout-label-three">See the real interaction</span>
      <span className="landing-callout-label landing-callout-label-four">The button is the product</span>
    </div>
  )
}

export function LandingTryWidgetHero() {
  const [open, setOpen] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>('praise')
  const [rating, setRating] = React.useState(0)
  const [screenshotReady, setScreenshotReady] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const userEdited = React.useRef(false)
  const userRated = React.useRef(false)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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
    <section className="landing-try-hero relative isolate overflow-hidden border-b" aria-labelledby="try-widget-title">
      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1600px] flex-col px-5 pb-12 sm:px-6">
        {!open && <HeroAnnotations />}

        <div className={cn('landing-try-heading relative z-[2] mx-auto max-w-[1080px] text-center', open && 'landing-try-heading-open')}>
          <h1 id="try-widget-title" className="text-[2.85rem] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[4rem] lg:text-[4.8rem]">
            We believe in “Show, don&apos;t tell”, your users will press this button.
          </h1>
        </div>

        <div className={cn('landing-try-stage relative mx-auto flex min-h-[310px] w-full items-center justify-center', open && 'landing-try-stage-open')}>
          <div className="landing-try-grid absolute inset-0" aria-hidden="true" />

          <div className="widget-theme-preview contents">
            {!open && (
              <button
                type="button"
                onClick={launchDemo}
                className="landing-try-launch group relative z-10 inline-flex min-h-16 items-center gap-3 rounded-full border px-8 text-base font-semibold transition-[transform,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 sm:min-h-20 sm:px-11 sm:text-lg"
              >
                Send feedback
                <MessageSquareText className="h-5 w-5 text-primary" />
              </button>
            )}

            {open && !submitted && (
            <div className="landing-demo-form relative z-20 w-full max-w-[520px] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-[0_38px_110px_-38px_rgb(0_0_0/0.58)]">
              <div className="flex items-start justify-between gap-5 border-b px-5 py-4 sm:px-6">
                <div>
                  <p className="text-base font-semibold">Tell ACME Corp everything</p>
                  <p className="mt-1 text-xs text-muted-foreground">Legal asked us to say “within reason.”</p>
                </div>
                <button type="button" onClick={closeDemo} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close demo feedback form"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold">What kind of feedback?</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {feedbackTypes.map(({ value, label, Icon }) => (
                      <button key={value} type="button" onClick={() => setFeedbackType(value)} aria-pressed={feedbackType === value} className={cn('inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-[background-color,border-color,color,transform] hover:-translate-y-0.5', feedbackType === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}><Icon className="h-3.5 w-3.5" />{label}</button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="landing-demo-message" className="mb-2 block text-xs font-semibold">Your message</label>
                  <div className="relative">
                    <textarea
                      id="landing-demo-message"
                      value={message}
                      onChange={(event) => { userEdited.current = true; setMessage(event.target.value) }}
                      onFocus={() => { userEdited.current = true }}
                      rows={4}
                      className="min-h-28 w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {!userEdited.current && message.length < typedMessage.length && <span className="landing-type-caret" aria-hidden="true" />}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Edit the message while it types. We can handle the interruption.</p>
                </div>

                <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold">How was it?</p>
                    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button key={value} type="button" onClick={() => { userRated.current = true; setRating(value) }} aria-label={`Rate ${value} stars`} className="rounded p-0.5 text-amber-400 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Star className={cn('h-6 w-6', value <= rating && 'fill-current')} /></button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => setScreenshotReady((ready) => !ready)} aria-pressed={screenshotReady} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors', screenshotReady ? 'border-primary/40 bg-primary/10 text-foreground' : 'bg-background text-muted-foreground hover:text-foreground')}><Camera className="h-4 w-4" />{screenshotReady ? 'Screenshot ready' : 'Add screenshot'}</button>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-muted-foreground">Page + browser context included</p>
                  <button type="button" disabled={!message.trim()} onClick={() => setSubmitted(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">Send feedback <ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            )}

            {open && submitted && (
            <div className="landing-demo-success relative z-20 flex min-h-[555px] w-full max-w-[520px] flex-col items-center justify-center overflow-hidden rounded-2xl border bg-card px-6 py-14 text-center shadow-[0_38px_110px_-38px_rgb(0_0_0/0.58)] sm:px-10 sm:py-16" aria-live="polite">
              {confetti.map(([left, rotate, delay], index) => <span key={`${left}-${index}`} className={cn('landing-success-confetti', index % 3 === 0 ? 'bg-primary' : index % 3 === 1 ? 'bg-amber-400' : 'bg-sky-400')} style={{ left, rotate, animationDelay: delay }} aria-hidden="true" />)}
              <span className="landing-success-mark relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageSquareText className="h-9 w-9" /></span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">That was the whole thing.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">In a real app, the team would now have your message, page, browser, rating{ screenshotReady ? ', and screenshot' : ''}. Here, it vanished responsibly.</p>
              <button type="button" onClick={launchDemo} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted"><RotateCcw className="h-4 w-4" />Try it again</button>
            </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
