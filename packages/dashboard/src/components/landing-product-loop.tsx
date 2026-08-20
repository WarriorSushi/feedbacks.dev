'use client'

import * as React from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Bug,
  Check,
  CircleHelp,
  Lightbulb,
  MessageSquare,
  PackageCheck,
  Pause,
  Play,
  Rocket,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DemoView = 'feedback' | 'updates'
type Category = 'bug' | 'idea' | 'praise' | 'question'

const AUTO_ADVANCE_MS = 8000

const categoryOptions: { value: Category; label: string; Icon: typeof Bug }[] = [
  { value: 'bug', label: 'Bug', Icon: Bug },
  { value: 'idea', label: 'Idea', Icon: Lightbulb },
  { value: 'praise', label: 'Praise', Icon: Star },
  { value: 'question', label: 'Question', Icon: CircleHelp },
]

const scenes = [
  {
    name: 'UltraSuper Corp',
    product: 'Serious buttons',
    mark: 'U',
    accent: '#c4b5fd',
    accentInk: '#21153d',
    message: 'The launch button pauses at 80%. It looks dramatic, but not useful.',
    updateTitle: 'The launch button now launches',
    updateBody: 'Progress keeps moving, and errors explain what needs attention.',
    Icon: Rocket,
  },
  {
    name: 'Probably Solvent',
    product: 'Money, allegedly',
    mark: 'P',
    accent: '#38bdf8',
    accentInk: '#082f49',
    message: 'Please let me compare this month with last year before finance notices.',
    updateTitle: 'Compare any two months',
    updateBody: 'Pick two dates and see the change. You can also download the chart.',
    Icon: BarChart3,
  },
  {
    name: 'Box Enjoyers Ltd.',
    product: 'Things in boxes',
    mark: 'B',
    accent: '#fb923c',
    accentInk: '#431407',
    message: 'Some overseas orders are missing when I print many labels at once.',
    updateTitle: 'Every label now prints',
    updateBody: 'Overseas orders are included. Parcel warns you before it skips a label.',
    Icon: PackageCheck,
  },
] as const

function OrbitCanvas() {
  return (
    <div className="absolute inset-0 grid grid-cols-[52px_minmax(0,1fr)] bg-[#0b0b10] sm:grid-cols-[132px_minmax(0,1fr)]">
      <aside className="border-r border-white/10 bg-[#08080c] px-2 py-5 sm:px-3" aria-label="UltraSuper Corp example menu">
        <Rocket className="mx-auto h-4 w-4 text-violet-300 sm:mx-2" />
        <div className="mt-7 space-y-2">
          {['Deploys', 'Apps', 'Logs'].map((item, index) => <div key={item} className={cn('rounded-md px-2 py-2 text-[10px]', index === 0 ? 'bg-violet-300/10 text-violet-200' : 'text-zinc-600')}><span className="hidden sm:inline">{item}</span></div>)}
        </div>
      </aside>
      <div className="overflow-hidden p-5 sm:p-7">
        <div className="flex items-end justify-between border-b border-white/10 pb-5"><div><p className="text-[9px] uppercase tracking-[0.16em] text-violet-300">Live deploys</p><p className="mt-1 text-lg font-semibold text-white">Production</p></div><span className="text-[9px] text-emerald-300">● 12 healthy</span></div>
        <div className="mt-6 space-y-2.5">
          {[['web-app', 'Building', '80%'], ['api', 'Ready', '100%'], ['worker', 'Ready', '100%']].map(([name, state, progress], index) => (
            <div key={name} className="grid grid-cols-[1fr_auto] gap-2 border border-white/10 bg-white/[0.025] px-3 py-3">
              <span className="font-mono text-[10px] text-zinc-300">{name}</span><span className={cn('text-[9px]', index === 0 ? 'text-amber-300' : 'text-emerald-300')}>{state}</span>
              <span className="col-span-2 h-1 bg-white/10"><span className="block h-full bg-violet-300" style={{ width: progress }} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LedgerlyCanvas() {
  return (
    <div className="absolute inset-0 bg-[#edf7fb] text-slate-900">
      <div className="flex h-14 items-center justify-between border-b border-sky-950/10 bg-white/80 px-5"><div className="flex items-center gap-2 font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-xs text-white">P</span> Probably Solvent</div><div className="hidden gap-5 text-[10px] text-slate-500 sm:flex"><span className="font-semibold text-sky-700">Overview</span><span>Money in</span><span>Bills</span></div></div>
      <div className="p-5 sm:p-7">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-medium text-slate-500">Cash on hand</p><p className="mt-1 text-2xl font-semibold tracking-tight">$184,200</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Up 12%</span></div>
        <div className="relative mt-7 h-36 rounded-xl border border-sky-950/10 bg-white p-3 shadow-sm" aria-hidden="true">
          <div className="absolute inset-x-3 top-1/3 border-t border-dashed border-slate-200"/><div className="absolute inset-x-3 top-2/3 border-t border-dashed border-slate-200"/>
          <svg viewBox="0 0 500 130" className="relative h-full w-full" preserveAspectRatio="none"><path d="M0 110 C50 104 75 82 120 90 S190 65 232 72 S305 38 354 47 S430 20 500 15" fill="none" stroke="#0284c7" strokeWidth="3"/><path d="M0 110 C50 104 75 82 120 90 S190 65 232 72 S305 38 354 47 S430 20 500 15 L500 130 L0 130Z" fill="#38bdf8" opacity=".12"/></svg>
        </div>
      </div>
    </div>
  )
}

function ParcelCanvas() {
  return (
    <div className="absolute inset-0 bg-[#fff8ed] text-stone-900">
      <div className="flex h-16 items-center justify-between bg-[#17251e] px-5 text-white"><div className="flex items-center gap-2 font-bold"><PackageCheck className="h-4 w-4 text-orange-300"/> Box Enjoyers Ltd.</div><span className="rounded-md bg-orange-300 px-2.5 py-1 text-[10px] font-bold text-orange-950">Print labels</span></div>
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Orders today</p><p className="mt-1 text-xl font-bold">248 to ship</p></div><div className="flex -space-x-2">{['M','J','A'].map((letter) => <span key={letter} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fff8ed] bg-stone-800 text-[9px] text-white">{letter}</span>)}</div></div>
        <div className="mt-6 overflow-hidden rounded-lg border border-orange-950/10 bg-white">
          <div className="grid grid-cols-[70px_1fr_auto] bg-orange-50 px-3 py-2 text-[9px] font-semibold uppercase text-stone-500"><span>Order</span><span>Ship to</span><span>Label</span></div>
          {[['#1048','Austin, US','Ready'],['#1047','Paris, FR','Missing'],['#1046','Osaka, JP','Missing']].map(([order, city, label], index) => <div key={order} className="grid grid-cols-[70px_1fr_auto] border-t border-stone-100 px-3 py-3 text-[10px]"><span className="font-mono font-semibold">{order}</span><span className="text-stone-500">{city}</span><span className={index ? 'font-semibold text-rose-600' : 'text-emerald-600'}>{label}</span></div>)}
        </div>
      </div>
    </div>
  )
}

function ProductCanvas({ sceneIndex }: { sceneIndex: number }) {
  if (sceneIndex === 1) return <LedgerlyCanvas />
  if (sceneIndex === 2) return <ParcelCanvas />
  return <OrbitCanvas />
}

function FeedbackPanel({ sceneIndex, category, rating, screenshotReady, sent, onCategory, onRating, onScreenshot, onSend, onClose }: { sceneIndex: number; category: Category; rating: number; screenshotReady: boolean; sent: boolean; onCategory: (value: Category) => void; onRating: (value: number) => void; onScreenshot: () => void; onSend: () => void; onClose: () => void }) {
  const scene = scenes[sceneIndex]
  const position = sceneIndex === 0 ? 'right-3 top-4 sm:right-5 sm:top-5' : sceneIndex === 1 ? 'bottom-16 left-1/2 -translate-x-1/2' : 'left-3 top-5 sm:left-5'
  const width = sceneIndex === 1 ? 'w-[min(500px,calc(100%-24px))]' : 'w-[min(330px,calc(100%-24px))]'

  if (sent) {
    return (
      <div className={cn('absolute z-20 flex min-h-[250px] flex-col items-center justify-center overflow-hidden border border-black/10 bg-[#fffdfa] px-7 text-center text-[#20211d] shadow-[0_28px_80px_rgb(0_0_0/0.42)]', position, width, sceneIndex === 1 ? 'rounded-2xl' : sceneIndex === 2 ? 'rounded-[20px]' : 'rounded-lg')}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: scene.accent, color: scene.accentInk }}><Check className="h-5 w-5"/></span>
        <p className="mt-4 text-base font-bold">Sent to {scene.name}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">The team also gets the page, browser, rating, and screenshot.</p>
      </div>
    )
  }

  return (
    <div className={cn('absolute z-20 animate-fade-in overflow-hidden border border-black/10 bg-[#fffdfa] text-[#20211d] shadow-[0_28px_80px_rgb(0_0_0/0.42)]', position, width, sceneIndex === 1 ? 'rounded-2xl' : sceneIndex === 2 ? 'rounded-[20px]' : 'rounded-lg')}>
      <div className="flex items-start justify-between border-b border-zinc-200 px-4 py-3.5"><div><p className="text-sm font-bold">{sceneIndex === 0 ? 'Report a deploy problem' : sceneIndex === 1 ? 'Help improve this report' : 'Report an order problem'}</p><p className="mt-0.5 text-[10px] text-zinc-500">This goes to the {scene.name} team.</p></div><button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-800" aria-label="Close feedback form"><X className="h-4 w-4"/></button></div>
      <div className={cn('p-4', sceneIndex === 1 && 'grid gap-3 sm:grid-cols-[120px_1fr]')}>
        <div className={cn(sceneIndex !== 1 && 'mb-3')}><p className="mb-1.5 text-[10px] font-semibold">What is this?</p><div className={cn('flex gap-1', sceneIndex === 1 && 'flex-col')}>{categoryOptions.slice(0, sceneIndex === 2 ? 2 : 4).map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => onCategory(value)} aria-pressed={category === value} className={cn('inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[9px] font-medium', category === value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-500')}><Icon className="h-3 w-3"/>{label}</button>)}</div></div>
        <div><p className="mb-1.5 text-[10px] font-semibold">Tell us what happened</p><div className="min-h-[55px] rounded-md border border-zinc-300 bg-white px-3 py-2 text-[10px] leading-4 text-zinc-700">{scene.message}</div></div>
        <div className={cn('mt-3 flex items-center justify-between border-t border-zinc-200 pt-3', sceneIndex === 1 && 'sm:col-span-2')}><div className="flex items-center gap-2"><span className="text-[9px] text-zinc-500">Rating</span><span className="flex">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => onRating(value)} aria-label={`${value} stars`} className="text-amber-400"><Star className={cn('h-3 w-3', value <= rating && 'fill-current')}/></button>)}</span></div><button type="button" onClick={onScreenshot} className="text-[9px] font-medium text-zinc-500">{screenshotReady ? '✓ Screen added' : '+ Add screen'}</button><button type="button" onClick={onSend} className="rounded-md px-3 py-2 text-[9px] font-bold" style={{ backgroundColor: scene.accent, color: scene.accentInk }}>Send</button></div>
      </div>
    </div>
  )
}

function UpdatePanel({ sceneIndex, onClose }: { sceneIndex: number; onClose: () => void }) {
  const scene = scenes[sceneIndex]
  const position = sceneIndex === 0 ? 'right-4 top-5 w-[min(320px,calc(100%-32px))]' : sceneIndex === 1 ? 'left-1/2 top-20 w-[min(440px,calc(100%-32px))] -translate-x-1/2' : 'bottom-5 left-4 right-4'
  return <div className={cn('absolute z-20 animate-fade-in overflow-hidden rounded-xl border border-black/10 bg-white text-zinc-900 shadow-[0_24px_70px_rgb(0_0_0/0.4)]', position)}><div className={cn('flex items-start justify-between gap-5 p-4', sceneIndex === 2 && 'sm:items-center')}><div><p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: sceneIndex === 2 ? '#c2410c' : sceneIndex === 1 ? '#0369a1' : '#7c3aed' }}>New for {scene.name} users</p><p className="mt-2 text-base font-bold">{scene.updateTitle}</p><p className="mt-1.5 max-w-xl text-[11px] leading-5 text-zinc-500">{scene.updateBody}</p></div><button type="button" onClick={onClose} className="shrink-0 p-1 text-zinc-400 hover:text-zinc-800" aria-label="Close update"><X className="h-4 w-4"/></button></div><div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-[9px] text-zinc-500"><span className="inline-flex items-center gap-1"><Check className="h-3 w-3"/> Shown inside the product</span><span className="inline-flex items-center gap-1 font-bold text-zinc-800">Try it <ArrowUpRight className="h-3 w-3"/></span></div></div>
}

export function LandingProductLoop() {
  const [view, setView] = React.useState<DemoView>('feedback')
  const [sceneIndex, setSceneIndex] = React.useState(0)
  const [category, setCategory] = React.useState<Category>('bug')
  const [rating, setRating] = React.useState(4)
  const [screenshotReady, setScreenshotReady] = React.useState(false)
  const [panelOpen, setPanelOpen] = React.useState(true)
  const [sent, setSent] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const scene = scenes[sceneIndex]

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
      setSceneIndex((current) => (current + 1) % scenes.length)
      setPanelOpen(true)
      setSent(false)
      setScreenshotReady(false)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [paused, reduceMotion, sceneIndex])

  const chooseScene = (index: number) => {
    setSceneIndex(index)
    setPaused(true)
    setPanelOpen(true)
    setSent(false)
    setScreenshotReady(false)
  }

  const changeView = (next: DemoView) => {
    setView(next)
    setPanelOpen(true)
    setSent(false)
  }

  return (
    <div className="landing-product-loop" aria-label="Live examples of feedbacks.dev inside three different customer products">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black" style={{ backgroundColor: scene.accent, color: scene.accentInk }}>{scene.mark}</span><span className="truncate text-xs font-semibold text-zinc-100">{scene.name}</span><span className="hidden text-[11px] text-zinc-500 sm:inline">A completely normal company</span></div><button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2 text-[10px] text-zinc-400 hover:text-white" aria-label={paused ? 'Resume examples' : 'Pause examples'}>{paused ? <Play className="h-3 w-3"/> : <Pause className="h-3 w-3"/>}<span className="hidden sm:inline">{paused ? 'Play' : 'Auto play'}</span></button></div>

      <div className="relative min-h-[455px] overflow-hidden sm:min-h-[470px]">
        <ProductCanvas sceneIndex={sceneIndex}/>
        {panelOpen && <div className="absolute inset-0 z-10 bg-black/35 backdrop-blur-[1px]" aria-hidden="true"/>}
        <div className="absolute bottom-4 right-3 z-30 inline-flex rounded-lg border border-white/10 bg-zinc-950/95 p-1 shadow-xl sm:right-5"><button type="button" onClick={() => changeView('feedback')} aria-pressed={view === 'feedback'} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-medium', view === 'feedback' ? 'text-zinc-950' : 'text-zinc-400')} style={view === 'feedback' ? { backgroundColor: scene.accent, color: scene.accentInk } : undefined}><MessageSquare className="h-3.5 w-3.5"/> Send feedback</button><button type="button" onClick={() => changeView('updates')} aria-pressed={view === 'updates'} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-medium', view === 'updates' ? 'text-zinc-950' : 'text-zinc-400')} style={view === 'updates' ? { backgroundColor: scene.accent, color: scene.accentInk } : undefined}><Sparkles className="h-3.5 w-3.5"/> See what changed</button></div>
        {!panelOpen && <button type="button" onClick={() => setPanelOpen(true)} className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2.5 text-xs font-bold shadow-xl" style={{ backgroundColor: scene.accent, color: scene.accentInk }}>{view === 'feedback' ? 'Send feedback' : 'See what changed'}</button>}
        {panelOpen && view === 'feedback' && <FeedbackPanel sceneIndex={sceneIndex} category={category} rating={rating} screenshotReady={screenshotReady} sent={sent} onCategory={setCategory} onRating={setRating} onScreenshot={() => setScreenshotReady((value) => !value)} onSend={() => setSent(true)} onClose={() => setPanelOpen(false)}/>}
        {panelOpen && view === 'updates' && <UpdatePanel sceneIndex={sceneIndex} onClose={() => setPanelOpen(false)}/>}
      </div>

      <div className="grid grid-cols-3 border-t border-white/10">{scenes.map((item, index) => <button key={item.name} type="button" onClick={() => chooseScene(index)} aria-pressed={sceneIndex === index} className={cn('relative px-3 py-3 text-left transition-colors sm:px-4', index > 0 && 'border-l border-white/10', sceneIndex === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]')}><span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200"><item.Icon className="h-3 w-3"/>{item.name}</span><span className="mt-0.5 hidden text-[9px] text-zinc-500 sm:block">{item.product}</span>{sceneIndex === index && <span key={`${sceneIndex}-${paused}`} className={cn('absolute bottom-0 left-0 h-0.5 w-full', !paused && !reduceMotion && 'landing-carousel-progress')} style={{ backgroundColor: scene.accent }}/>}</button>)}</div>
    </div>
  )
}
