'use client'

import * as React from 'react'
import { Check, Code2, MessageSquare, Palette, Radio, ShieldCheck } from 'lucide-react'
import { CodeSnippet } from '@/components/code-snippet'
import { cn } from '@/lib/utils'

const steps = [
  { title: 'Copy the snippet', detail: 'Recommended setup first' },
  { title: 'Send one test', detail: 'Know the connection works' },
  { title: 'Customize later', detail: 'No new code required' },
] as const

const AUTO_ADVANCE_MS = 6200

export function LandingInstallStory({ snippet }: { snippet: string }) {
  const [active, setActive] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % steps.length), AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [active, paused])

  const chooseStep = (index: number) => {
    setActive(index)
    setPaused(true)
  }

  return (
    <div className="overflow-hidden border-y border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[var(--shadow-float)] sm:rounded-[16px] sm:border">
      <div className="grid border-b border-white/10 sm:grid-cols-3">
        {steps.map((step, index) => (
          <button key={step.title} type="button" onClick={() => chooseStep(index)} aria-pressed={active === index} className={cn('relative flex min-h-[72px] items-center gap-3 border-white/10 px-5 text-left transition-colors sm:border-l sm:first:border-l-0', index > 0 && 'border-t sm:border-t-0', active === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.03]')}>
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]', active === index ? 'border-lime-300 bg-lime-300 text-zinc-950' : 'border-white/15 text-zinc-400')}>{index + 1}</span>
            <span><span className="block text-xs font-semibold">{step.title}</span><span className="mt-1 block text-[10px] text-zinc-400">{step.detail}</span></span>
            {active === index && <span className={cn('absolute bottom-0 left-0 h-0.5 w-full bg-lime-300', !paused && 'landing-install-progress')} />}
          </button>
        ))}
      </div>

      <div className="relative min-h-[330px] p-4 sm:p-6">
        <div key={active} className="animate-fade-in">
          {active === 0 && (
            <div className="grid min-h-[282px] items-center gap-6 md:grid-cols-[0.72fr_1.28fr]">
              <div className="px-2 sm:px-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-300">Step 1</p>
                <h3 className="mt-3 text-xl font-semibold">Paste one safe snippet.</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-zinc-400">Create a project and copy the Website snippet into your app shell. The visible project key is designed for browser use.</p>
                <p className="mt-5 inline-flex items-center gap-2 text-[10px] text-zinc-400"><ShieldCheck className="h-3.5 w-3.5 text-lime-300" />No private credential enters the browser</p>
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between text-[10px] text-zinc-400"><span className="inline-flex items-center gap-2"><Code2 className="h-3.5 w-3.5" /> Website snippet</span><span className="text-lime-300">Recommended</span></div>
                <CodeSnippet className="border-zinc-700 bg-zinc-900 text-zinc-100" tabs={[{ label: 'HTML', code: snippet, language: 'html' }]} wrap maxHeightClassName="max-h-56" />
              </div>
            </div>
          )}

          {active === 1 && (
            <div className="grid min-h-[282px] items-center gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div className="px-2 sm:px-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-300">Step 2</p>
                <h3 className="mt-3 text-xl font-semibold">Send one private test.</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-zinc-400">Open your app and submit a message. When it appears in the inbox, setup is complete.</p>
              </div>
              <div className="border border-lime-300/20 bg-lime-300/[0.055] p-5 sm:p-6">
                <div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-300 text-zinc-950"><Check className="h-4 w-4" /></span><div><p className="text-sm font-semibold">Test feedback received</p><p className="mt-1 text-[11px] leading-5 text-zinc-400">Orbit · /reports/export · Edge · just now</p></div></div>
                <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2"><span className="inline-flex items-center gap-2 text-[10px] text-zinc-400"><MessageSquare className="h-3.5 w-3.5 text-lime-300" /> Message reached the inbox</span><span className="inline-flex items-center gap-2 text-[10px] text-zinc-400"><Radio className="h-3.5 w-3.5 text-lime-300" /> Page context attached</span></div>
              </div>
            </div>
          )}

          {active === 2 && (
            <div className="grid min-h-[282px] items-center gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div className="px-2 sm:px-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-300">Step 3</p>
                <h3 className="mt-3 text-xl font-semibold">Make it yours when ready.</h3>
                <p className="mt-3 max-w-sm text-xs leading-5 text-zinc-400">Change the question, fields, color, and button after setup. Saved changes reach the existing embed remotely.</p>
              </div>
              <div className="border border-white/10 bg-[#18191c]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="text-xs font-semibold">Feedback form</span><span className="text-[10px] text-lime-300">Saved remotely</span></div>
                <div className="divide-y divide-white/[0.07] px-4">
                  <div className="flex items-center justify-between py-4"><span className="inline-flex items-center gap-2 text-xs text-zinc-300"><MessageSquare className="h-3.5 w-3.5 text-zinc-400" /> Fields</span><span className="text-[10px] text-zinc-400">Message · category · screenshot</span></div>
                  <div className="flex items-center justify-between py-4"><span className="inline-flex items-center gap-2 text-xs text-zinc-300"><Palette className="h-3.5 w-3.5 text-zinc-400" /> Appearance</span><span className="inline-flex items-center gap-2 text-[10px] text-zinc-400"><span className="h-3 w-3 rounded-full bg-violet-300" /> Matches your product</span></div>
                  <div className="flex items-center justify-between py-4"><span className="inline-flex items-center gap-2 text-xs text-zinc-300"><Code2 className="h-3.5 w-3.5 text-zinc-400" /> Installed code</span><span className="text-[10px] text-lime-300">Unchanged</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
