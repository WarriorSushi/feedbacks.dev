'use client'

import * as React from 'react'
import {
  BellRing,
  Check,
  Code2,
  Inbox,
  MessageSquareText,
  MonitorUp,
  Paperclip,
  Pause,
  Play,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const AUTO_ADVANCE_MS = 4300

const scenes = [
  { label: 'Install', detail: 'Paste one snippet', Icon: Code2 },
  { label: 'Collect', detail: 'User sends context', Icon: MessageSquareText },
  { label: 'Triage', detail: 'Your team acts', Icon: Inbox },
  { label: 'Close loop', detail: 'User sees the fix', Icon: BellRing },
] as const

export function LandingHeroDemo({ installSnippet }: { installSnippet: string }) {
  const [active, setActive] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    if (paused || reduceMotion) return
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % scenes.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [active, paused, reduceMotion])

  const chooseScene = (index: number) => {
    setActive(index)
    setPaused(true)
  }

  return (
    <div className="landing-demo-shell" aria-label="Animated walkthrough: install the widget, collect feedback, triage it, and show the fix">
      <div className="landing-demo-topbar">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="landing-demo-status" aria-hidden="true" />
          <span className="truncate text-[11px] font-semibold text-zinc-100">Orbit / production</span>
          <span className="hidden text-[10px] text-zinc-500 sm:inline">Live product walkthrough</span>
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="inline-flex h-7 items-center gap-1.5 rounded border border-white/10 px-2 text-[10px] font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-100"
          aria-label={paused ? 'Play product walkthrough' : 'Pause product walkthrough'}
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          <span>{paused ? 'Play' : 'Playing'}</span>
        </button>
      </div>

      <div className="landing-demo-stage">
        <div className="landing-demo-grid" aria-hidden="true" />
        <div key={active} className="landing-demo-scene">
          {active === 0 && <InstallScene installSnippet={installSnippet} />}
          {active === 1 && <CollectScene />}
          {active === 2 && <TriageScene />}
          {active === 3 && <CloseLoopScene />}
        </div>
      </div>

      <div className="grid grid-cols-4 border-t border-white/10">
        {scenes.map(({ label, detail, Icon }, index) => (
          <button
            key={label}
            type="button"
            onClick={() => chooseScene(index)}
            aria-pressed={active === index}
            className={cn(
              'relative min-w-0 px-2 py-3 text-left transition-colors sm:px-3.5 sm:py-3.5',
              index > 0 && 'border-l border-white/10',
              active === index ? 'bg-white/[0.075]' : 'hover:bg-white/[0.035]',
            )}
          >
            <span className="landing-demo-tab-label flex items-center gap-1.5 text-[9px] font-semibold text-zinc-200 sm:text-[10px]">
              <Icon className={cn('landing-demo-tab-icon h-3 w-3 shrink-0', active === index ? 'landing-demo-tab-icon-active text-lime-300' : 'text-zinc-500')} />
              <span className="truncate">{label}</span>
            </span>
            <span className="landing-demo-tab-detail mt-1 hidden truncate text-[9px] text-zinc-500 sm:block">{detail}</span>
            {active === index && (
              <span
                key={`${active}-${paused}`}
                className={cn('absolute inset-x-0 bottom-0 h-0.5 bg-lime-300', !paused && !reduceMotion && 'landing-demo-progress')}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function SceneLabel({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-lime-300">{step}</p>
      <p className="mt-1.5 max-w-[260px] text-sm font-semibold leading-5 text-zinc-100 sm:text-base">{children}</p>
    </div>
  )
}

function InstallScene({ installSnippet }: { installSnippet: string }) {
  return (
    <>
      <SceneLabel step="01 / Install">One copy-paste. Your app is connected.</SceneLabel>
      <div className="landing-demo-code-window">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-medium text-zinc-300"><Code2 className="h-3.5 w-3.5 text-lime-300" />app/layout.tsx</span>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-lime-300"><Check className="h-3 w-3" />Copied</span>
        </div>
        <pre className="landing-demo-code"><code>{installSnippet}</code></pre>
        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-[9px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-300 landing-demo-pulse" />
          Widget connected in 2.1s
        </div>
      </div>
      <div className="landing-demo-float landing-demo-float-install hidden sm:flex">
        <MonitorUp className="h-4 w-4 text-lime-300" />
        <span><strong className="block text-[10px] text-zinc-100">No rebuild later</strong><span className="text-[9px] text-zinc-500">Change the form remotely</span></span>
      </div>
    </>
  )
}

function CollectScene() {
  return (
    <>
      <SceneLabel step="02 / Collect">Users report the problem without leaving your app.</SceneLabel>
      <div className="landing-demo-app-window">
        <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
          <span className="text-[10px] font-semibold text-zinc-200">Orbit reports</span>
          <span className="text-[9px] text-zinc-500">/reports/export</span>
        </div>
        <div className="grid h-[210px] grid-cols-[74px_1fr] sm:h-[245px] sm:grid-cols-[110px_1fr]">
          <div className="border-r border-white/10 bg-black/15 p-3">
            <div className="h-2 w-10 rounded-full bg-white/15" />
            <div className="mt-4 space-y-2"><div className="h-6 bg-white/[0.07]" /><div className="h-6 bg-white/[0.03]" /><div className="h-6 bg-white/[0.03]" /></div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="h-2 w-24 rounded-full bg-white/15" />
            <div className="mt-4 h-20 border border-white/10 bg-white/[0.025] p-3">
              <svg viewBox="0 0 320 60" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C45 42 67 49 103 32 S164 26 197 20 S258 25 320 6" fill="none" stroke="rgb(190 242 100)" strokeWidth="2" /></svg>
            </div>
          </div>
        </div>
      </div>
      <div className="landing-demo-feedback-card">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div><p className="text-[11px] font-bold text-zinc-900">Report a problem</p><p className="mt-0.5 text-[9px] text-zinc-500">Orbit team</p></div>
          <span className="rounded bg-rose-50 px-1.5 py-1 text-[8px] font-bold text-rose-700">BUG</span>
        </div>
        <div className="p-4">
          <div className="min-h-[58px] border border-zinc-300 bg-white px-3 py-2 text-[10px] leading-4 text-zinc-700">Export keeps spinning after I choose the last 90 days.</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[9px] text-zinc-500"><Paperclip className="h-3 w-3" />Screenshot</span>
            <span className="inline-flex items-center gap-1.5 bg-zinc-900 px-3 py-2 text-[9px] font-bold text-white"><Send className="h-3 w-3" />Send</span>
          </div>
        </div>
      </div>
    </>
  )
}

function TriageScene() {
  return (
    <>
      <SceneLabel step="03 / Triage">The inbox already knows where it happened.</SceneLabel>
      <div className="landing-demo-inbox">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-zinc-200"><Inbox className="h-3.5 w-3.5 text-lime-300" />Feedback inbox</span>
          <span className="rounded bg-lime-300/10 px-2 py-1 text-[8px] font-semibold text-lime-300">1 new</span>
        </div>
        <div className="grid grid-cols-[0.8fr_1.2fr]">
          <div className="border-r border-white/10">
            <div className="border-b border-white/10 bg-white/[0.07] p-3 sm:p-4"><p className="text-[9px] font-semibold leading-4 text-zinc-100 sm:text-[10px]">Export keeps spinning...</p><p className="mt-1.5 text-[8px] text-zinc-500">Bug · just now</p></div>
            <div className="border-b border-white/10 p-3 opacity-50 sm:p-4"><div className="h-2 w-20 bg-white/10" /><div className="mt-2 h-2 w-12 bg-white/5" /></div>
            <div className="p-3 opacity-30 sm:p-4"><div className="h-2 w-16 bg-white/10" /><div className="mt-2 h-2 w-10 bg-white/5" /></div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="rounded bg-rose-400/10 px-2 py-1 text-[8px] font-semibold text-rose-300">BUG</span><span className="rounded bg-sky-400/10 px-2 py-1 text-[8px] text-sky-300">EXPORT</span></div>
            <p className="mt-4 text-[11px] font-semibold leading-5 text-zinc-100 sm:text-sm">Export keeps spinning after I choose the last 90 days.</p>
            <dl className="mt-4 grid gap-2 border-y border-white/10 py-3 text-[8px] sm:grid-cols-2 sm:text-[9px]"><div><dt className="text-zinc-500">Page</dt><dd className="mt-1 text-zinc-300">/reports/export</dd></div><div><dt className="text-zinc-500">Browser</dt><dd className="mt-1 text-zinc-300">Edge · Windows</dd></div></dl>
            <div className="mt-4 inline-flex items-center gap-1.5 bg-lime-300 px-3 py-2 text-[9px] font-bold text-zinc-950"><Check className="h-3 w-3" />Mark planned</div>
          </div>
        </div>
      </div>
      <div className="landing-demo-float landing-demo-float-triage">
        <Check className="h-4 w-4 text-lime-300" />
        <span><strong className="block text-[10px] text-zinc-100">Routed to GitHub</strong><span className="text-[9px] text-zinc-500">Issue #284 created</span></span>
      </div>
    </>
  )
}

function CloseLoopScene() {
  return (
    <>
      <SceneLabel step="04 / Close the loop">Ship the fix. Tell users inside the same app.</SceneLabel>
      <div className="landing-demo-release-app">
        <div className="flex h-11 items-center justify-between border-b border-white/10 px-4"><span className="text-[10px] font-semibold text-zinc-200">Orbit</span><span className="inline-flex items-center gap-1.5 text-[9px] text-zinc-500"><BellRing className="h-3 w-3" />1 update</span></div>
        <div className="p-5 sm:p-7"><div className="h-3 w-32 bg-white/10" /><div className="mt-5 grid grid-cols-3 gap-3"><div className="h-20 border border-white/10 bg-white/[0.02]" /><div className="h-20 border border-white/10 bg-white/[0.02]" /><div className="h-20 border border-white/10 bg-white/[0.02]" /></div></div>
      </div>
      <div className="landing-demo-update-card">
        <div className="bg-lime-300 p-4 text-zinc-950 sm:p-5"><p className="text-[8px] font-black uppercase tracking-[0.15em]">Shipped today</p><p className="mt-2 text-base font-bold sm:text-lg">Exports finish reliably</p></div>
        <div className="p-4 sm:p-5"><p className="text-[10px] leading-5 text-zinc-400">Large date ranges now export in the background. We will notify you when the file is ready.</p><div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[9px] text-lime-300"><Check className="h-3 w-3" />Shown to affected users</div></div>
      </div>
    </>
  )
}
