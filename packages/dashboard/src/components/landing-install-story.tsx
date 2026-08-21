'use client'

import * as React from 'react'
import {
  Check,
  Code2,
  Inbox,
  MessageSquare,
  MousePointer2,
  Palette,
  Pause,
  Play,
  Radio,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const chapters = [
  {
    title: 'Paste one snippet',
    detail: 'Add the browser-safe embed once. The feedback button appears immediately.',
  },
  {
    title: 'Send one real test',
    detail: 'Submit a message from your app and watch its page and browser context arrive.',
  },
  {
    title: 'Change it without reinstalling',
    detail: 'Edit fields, color, and button text later. The existing embed updates remotely.',
  },
] as const

const AUTO_ADVANCE_MS = 6800

export function LandingInstallStory({ snippet }: { snippet: string }) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (paused || reduceMotion || !inView || document.hidden) return
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % chapters.length), AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [active, inView, paused, reduceMotion])

  const chooseChapter = (index: number) => {
    setActive(index)
    setPaused(true)
  }

  return (
    <div ref={rootRef} className="landing-product-cinema" aria-label="Product walkthrough: install, test, and customize feedbacks.dev">
      <div className="landing-product-screen">
        <div className="landing-product-screen-bar">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-300/80" />
            <span className="h-2 w-2 rounded-full bg-lime-300" />
          </div>
          <span className="hidden items-center gap-2 text-[10px] font-medium text-zinc-400 sm:inline-flex">
            <Radio className="h-3 w-3 text-lime-300" /> ACME App · live setup
          </span>
          <span className="font-mono text-[9px] text-zinc-500">0{active + 1} / 03</span>
        </div>

        <div className="landing-product-stage">
          <div className="landing-product-stage-grid" aria-hidden="true" />
          <div key={active} className="landing-product-scene">
            {active === 0 && <InstallScene snippet={snippet} />}
            {active === 1 && <TestScene />}
            {active === 2 && <CustomizeScene />}
          </div>
        </div>

        <div className="landing-product-screen-foot">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-lime-300" />Private credentials stay server-side</span>
          <span className="hidden text-zinc-500 sm:inline">No rebuild after customization</span>
        </div>
      </div>

      <div className="landing-product-chapters">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-lime-300">See the setup happen</p>
          <h3 className="mt-4 max-w-md text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">From pasted code to useful feedback in minutes.</h3>
        </div>

        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.title}
              type="button"
              aria-pressed={active === index}
              onClick={() => chooseChapter(index)}
              className={cn('landing-product-chapter group relative w-full py-5 text-left', active === index && 'is-active')}
            >
              <span className="flex items-start gap-4">
                <span className={cn('mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] transition-all', active === index ? 'border-lime-300 bg-lime-300 text-zinc-950' : 'border-white/15 text-zinc-500 group-hover:border-white/30 group-hover:text-zinc-300')}>{index + 1}</span>
                <span>
                  <span className={cn('block text-lg font-semibold tracking-[-0.025em] transition-colors', active === index ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300')}>{chapter.title}</span>
                  <span className={cn('mt-2 block max-w-sm text-xs leading-5 transition-colors', active === index ? 'text-zinc-300' : 'text-zinc-600')}>{chapter.detail}</span>
                </span>
              </span>
              {active === index && !paused && !reduceMotion && <span className="landing-product-chapter-progress" />}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setPaused((value) => !value)} className="mt-5 inline-flex items-center gap-2 text-[10px] font-medium text-zinc-500 transition-colors hover:text-white" aria-label={paused ? 'Resume product walkthrough' : 'Pause product walkthrough'}>
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? 'Resume walkthrough' : 'Pause walkthrough'}
        </button>
      </div>
    </div>
  )
}

function InstallScene({ snippet }: { snippet: string }) {
  return (
    <div className="landing-product-code-scene">
      <div className="landing-product-code-window">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] text-zinc-300"><Code2 className="h-3.5 w-3.5 text-lime-300" />app/layout.tsx</span>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-lime-300"><Check className="h-3 w-3" />Copied</span>
        </div>
        <pre className="landing-product-code"><code>{snippet}</code></pre>
      </div>
      <div className="landing-product-toast landing-product-toast-connected">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 text-zinc-950"><Check className="h-4 w-4" /></span>
        <span><strong className="block text-[11px] text-white">Widget connected</strong><span className="text-[9px] text-zinc-500">Ready for a test report</span></span>
      </div>
      <MousePointer2 className="landing-product-cursor h-5 w-5 fill-white text-zinc-950" />
    </div>
  )
}

function TestScene() {
  return (
    <div className="landing-product-test-scene">
      <div className="landing-product-app-preview">
        <div className="flex h-10 items-center justify-between border-b border-white/10 px-4 text-[9px] text-zinc-500"><span className="font-semibold text-zinc-300">ACME reports</span><span>/reports/export</span></div>
        <div className="grid h-[235px] grid-cols-[92px_1fr]">
          <div className="border-r border-white/10 p-3"><div className="h-2 w-10 rounded-full bg-white/15" /><div className="mt-5 space-y-3"><div className="h-7 bg-white/[0.07]" /><div className="h-7 bg-white/[0.03]" /><div className="h-7 bg-white/[0.03]" /></div></div>
          <div className="p-5"><div className="h-2 w-28 rounded-full bg-white/15" /><div className="mt-5 h-24 border border-white/10 bg-white/[0.025]" /></div>
        </div>
      </div>
      <div className="landing-product-feedback-form">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3"><span className="text-[11px] font-bold text-zinc-900">Report a problem</span><span className="rounded bg-rose-50 px-2 py-1 text-[8px] font-bold text-rose-700">BUG</span></div>
        <div className="p-4"><p className="landing-product-typed-copy min-h-[68px] border border-zinc-300 bg-white p-3 text-[10px] leading-4 text-zinc-700">Export keeps spinning after I choose the last 90 days.</p><div className="mt-3 flex justify-end"><span className="bg-zinc-900 px-4 py-2 text-[9px] font-bold text-white">Send feedback</span></div></div>
      </div>
      <div className="landing-product-toast landing-product-toast-received"><Inbox className="h-4 w-4 text-lime-300" /><span><strong className="block text-[11px] text-white">Feedback received</strong><span className="text-[9px] text-zinc-500">Page and browser attached</span></span></div>
    </div>
  )
}

function CustomizeScene() {
  return (
    <div className="landing-product-customize-scene">
      <div className="landing-product-settings-window">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white"><Palette className="h-4 w-4 text-lime-300" />Feedback form</span><span className="text-[9px] text-lime-300">Saving…</span></div>
        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          <div className="divide-y divide-white/[0.07] border-b border-white/10 px-5 md:border-b-0 md:border-r">
            <div className="py-4"><p className="text-[9px] text-zinc-500">Button text</p><p className="mt-2 text-[11px] text-zinc-200">Share feedback</p></div>
            <div className="py-4"><p className="text-[9px] text-zinc-500">Fields</p><p className="mt-2 text-[11px] text-zinc-200">Message · category · screenshot</p></div>
            <div className="py-4"><p className="text-[9px] text-zinc-500">Accent</p><div className="mt-2 flex gap-2"><span className="h-5 w-5 rounded-full bg-lime-300 ring-2 ring-white ring-offset-2 ring-offset-zinc-900" /><span className="h-5 w-5 rounded-full bg-violet-300" /><span className="h-5 w-5 rounded-full bg-sky-300" /></div></div>
          </div>
          <div className="flex items-center justify-center p-6"><div className="landing-product-mini-widget"><MessageSquare className="h-4 w-4" /><span>Share feedback</span></div></div>
        </div>
      </div>
      <div className="landing-product-toast landing-product-toast-saved"><Check className="h-4 w-4 text-lime-300" /><span><strong className="block text-[11px] text-white">Live app updated</strong><span className="text-[9px] text-zinc-500">Installed code stayed the same</span></span></div>
    </div>
  )
}
