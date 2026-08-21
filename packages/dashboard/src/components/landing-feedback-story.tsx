'use client'

import * as React from 'react'
import { ArrowRight, Check, CircleDot, MessageSquare, Send, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { label: 'A user tells you', note: 'In your app' },
  { label: 'Your team fixes it', note: 'In your inbox' },
  { label: 'Users see the fix', note: 'Back in your app' },
] as const

const AUTO_ADVANCE_MS = 8000

export function LandingFeedbackStory() {
  const [active, setActive] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((value) => (value + 1) % steps.length), AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [paused])

  const chooseStep = (index: number) => {
    setActive(index)
    setPaused(true)
  }

  return (
    <div className="landing-story overflow-hidden border-y border-foreground/15 bg-[#121315] text-zinc-100 shadow-[var(--shadow-float)] lg:rounded-[18px] lg:border">
      <div className="grid border-b border-white/10 md:grid-cols-3">
        {steps.map((step, index) => (
          <button
            key={step.label}
            type="button"
            onClick={() => chooseStep(index)}
            aria-pressed={active === index}
            className={cn(
              'relative flex items-center gap-3 border-white/10 px-5 py-4 text-left transition-colors md:border-l md:first:border-l-0',
              index > 0 && 'border-t md:border-t-0',
              active === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.035]',
            )}
          >
            <span className={cn('landing-story-step-number flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold', active === index ? 'border-lime-300 bg-lime-300 text-zinc-950' : 'border-white/15 text-zinc-400')}>{index + 1}</span>
            <span><span className="landing-story-step-label block text-xs font-semibold text-zinc-100">{step.label}</span><span className="landing-story-step-note mt-0.5 block text-[10px] text-zinc-400">{step.note}</span></span>
            {active === index && <span className={cn('absolute bottom-0 left-0 h-0.5 w-full bg-lime-300', !paused && 'landing-story-progress')} />}
          </button>
        ))}
      </div>

      <div className="relative min-h-[390px] overflow-hidden p-5 sm:p-8">
        <div className="absolute inset-0 landing-stage-grid opacity-40" />
        <div key={active} className="relative mx-auto flex min-h-[325px] max-w-5xl animate-fade-in items-center justify-center">
          {active === 0 && (
            <div className="grid w-full items-center gap-8 md:grid-cols-[0.85fr_1.15fr]">
              <div className="max-w-sm">
                <p className="text-xs font-semibold text-lime-300">A user gets stuck</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">They tell you without leaving your app.</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">The message comes with the page, browser, rating, and screenshot. Your team sees where the problem happened.</p>
              </div>
              <div className="landing-feedback-capture-card relative mx-auto w-full max-w-lg border border-white/10 bg-[#1a1b1e] p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-xs font-semibold">ACME App / Deployment #8421</span><span className="text-[10px] text-zinc-400">production</span></div>
                <div className="mt-5 border border-rose-400/35 bg-rose-400/[0.07] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-rose-300"><CircleDot className="h-3 w-3" /> BUILD STALLED</div>
                  <p className="mt-2 text-sm text-zinc-200">Build logs stop updating after the deploy reaches 80%.</p>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400"><span>/deployments/8421 · Edge 128</span><span className="inline-flex items-center gap-1 text-lime-300"><Check className="h-3 w-3" /> Screenshot</span></div>
                </div>
              </div>
            </div>
          )}

          {active === 1 && (
            <div className="landing-feedback-inbox w-full max-w-5xl border border-white/10 bg-[#18191c] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-300">Your feedback inbox</p><p className="mt-1 text-sm font-semibold">ACME App</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-zinc-400">1 new message</span></div>
              <div className="grid md:grid-cols-[0.86fr_1.14fr]">
                <div className="border-b border-white/10 md:border-b-0 md:border-r">
                  {['Build logs stop updating after…', 'Search misses archived services', 'Love the new deploy diff'].map((item, index) => (
                    <div key={item} className={cn('border-b border-white/[0.07] px-5 py-4 last:border-b-0', index === 0 ? 'bg-white/[0.06]' : '')}><p className="truncate text-xs text-zinc-200">{item}</p><p className="mt-1 text-[10px] text-zinc-400">{index === 0 ? 'Bug · just now' : index === 1 ? 'Idea · 2h' : 'Praise · yesterday'}</p></div>
                  ))}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 px-2 py-1 text-[10px] text-rose-300"><CircleDot className="h-3 w-3" /> Bug</span><span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-1 text-[10px] text-sky-300"><Tag className="h-3 w-3" /> Deployments</span></div>
                  <p className="mt-5 text-base font-semibold leading-6">Build logs stop updating after the deploy reaches 80%.</p>
                  <dl className="mt-5 grid grid-cols-2 gap-y-3 border-y border-white/10 py-4 text-[10px]"><div><dt className="text-zinc-400">Page</dt><dd className="mt-1 text-zinc-300">/deployments/8421</dd></div><div><dt className="text-zinc-400">Browser</dt><dd className="mt-1 text-zinc-300">Edge 128</dd></div><div><dt className="text-zinc-400">Rating</dt><dd className="mt-1 text-amber-300">★★★★☆</dd></div><div><dt className="text-zinc-400">Screenshot</dt><dd className="mt-1 text-lime-300">Attached</dd></div></dl>
                  <button type="button" onClick={() => setActive(2)} className="mt-5 inline-flex items-center gap-2 bg-lime-300 px-3 py-2 text-[10px] font-bold text-zinc-950 transition-transform hover:-translate-y-0.5">Mark fixed and tell users <ArrowRight className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          )}

          {active === 2 && (
            <div className="grid w-full items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
              <div className="max-w-sm">
                <p className="text-xs font-semibold text-lime-300">The user sees your work</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Show the fix inside your app.</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Write one short message in feedbacks.dev. Your app shows it with the code you already added.</p>
              </div>
              <div className="landing-feedback-update relative mx-auto w-full max-w-md overflow-hidden border border-white/10 bg-[#1a1b1e] shadow-2xl">
                <div className="bg-violet-300 p-5 text-[#1b1328]"><p className="text-[9px] font-black uppercase tracking-[0.14em]">New in ACME App</p><p className="mt-3 text-xl font-bold">Live build logs are here</p></div>
                <div className="p-5"><p className="text-xs leading-5 text-zinc-400">Watch each build step. When a build fails, ACME App now tells you what to fix.</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><span className="inline-flex items-center gap-1 text-[10px] text-lime-300"><Check className="h-3 w-3" /> Shown in ACME App</span><button type="button" onClick={() => setActive(0)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-200 transition-colors hover:text-lime-300">Start again <ArrowRight className="h-3 w-3" /></button></div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-[10px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-lime-300" /> One clear path from problem to fix</span>
        <button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex items-center gap-2 self-start text-zinc-400 hover:text-white"><Send className="h-3 w-3" /> {paused ? 'Resume story' : 'Pause story'}</button>
      </div>
    </div>
  )
}
