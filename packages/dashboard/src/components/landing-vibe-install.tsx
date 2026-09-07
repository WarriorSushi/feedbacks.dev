'use client'

import * as React from 'react'
import Image from 'next/image'
import { Bot, Check, Code2, Copy, MousePointerClick, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const agentPrompt = `Install feedbacks.dev in this project using the project-specific setup details from my dashboard.

1. Find the shared app shell or root layout.
2. Add the exact dashboard-generated snippet once.
3. Do not expose private API keys or server credentials.
4. Start the app and confirm the feedback button appears without layout shift.
5. Send one test report, confirm the request succeeds, and ask me to verify its page and browser context in the inbox.
6. Summarize the changed file and verification result.`

type InstallView = 'code' | 'agent'

export function LandingVibeInstall({ snippet }: { snippet: string }) {
  const [view, setView] = React.useState<InstallView>('code')
  const [copied, setCopied] = React.useState(false)
  const activeValue = view === 'code' ? snippet : agentPrompt

  const copy = async () => {
    await navigator.clipboard.writeText(activeValue)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="landing-app-window landing-install-shell relative overflow-hidden rounded-2xl border bg-[#0b0e0b] text-[#f5f7f1] shadow-[0_36px_110px_-52px_rgb(0_0_0/0.9)]">
      <div className="landing-window-chrome">feedbacks.dev Setup Wizard</div>
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-white/10 p-6 sm:p-9 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">Install once</p>
          <h3 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">One exact snippet. Then the form follows your settings.</h3>
          <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">Copy the dashboard-generated embed yourself, or hand the bounded instruction to your coding agent. Either path ends with a real test report.</p>

          <ol className="mt-8 space-y-4 text-sm">
            {[
              [Code2, 'Create a project', 'Your browser-safe project key is generated for you.'],
              [MousePointerClick, 'Paste once', 'Put the stable embed in the shared app shell.'],
              [Check, 'Send one test', 'Verify the real page and browser arrive in the inbox.'],
            ].map(([Icon, title, body], index) => {
              const StepIcon = Icon as typeof Code2
              return (
                <li key={String(title)} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-300/10 text-lime-300"><StepIcon className="h-4 w-4" /></span>
                  <div><p className="font-semibold text-zinc-100">{index + 1}. {String(title)}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{String(body)}</p></div>
                </li>
              )
            })}
          </ol>

          <p className="mt-6 flex items-center gap-2 text-xs text-zinc-400"><ShieldCheck className="h-4 w-4 text-lime-300" />No private key belongs in the browser.</p>
        </div>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-white/10 bg-white/[0.035] p-1" role="tablist" aria-label="Installation method">
              <button type="button" role="tab" aria-selected={view === 'code'} onClick={() => { setView('code'); setCopied(false) }} className={cn('inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-semibold text-zinc-400 transition-colors', view === 'code' && 'bg-white/10 text-white')}><Code2 className="h-3.5 w-3.5" />Install code</button>
              <button type="button" role="tab" aria-selected={view === 'agent'} onClick={() => { setView('agent'); setCopied(false) }} className={cn('inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-semibold text-zinc-400 transition-colors', view === 'agent' && 'bg-white/10 text-white')}><Bot className="h-3.5 w-3.5" />Agent brief</button>
            </div>
            <button type="button" onClick={copy} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/10', copied && 'border-lime-300/40 text-lime-300')}><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : view === 'code' ? 'Copy snippet' : 'Copy brief'}</button>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500"><span>{view === 'code' ? 'Dashboard-generated snippet' : 'A bounded task for your coding agent'}</span><span>{view === 'code' ? 'HTML' : 'Plain text'}</span></div>
          <div className="landing-install-code-frame relative mt-4 overflow-hidden rounded-xl">
            <pre className="min-h-[420px] overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/15 bg-[#e7ebe5] p-5 font-mono text-[11px] leading-6 text-[#1b201b] shadow-inner sm:p-6"><code>{activeValue}</code></pre>
            <span className="landing-install-code-scan absolute inset-x-0 top-0 h-px" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500 lg:max-w-[62%]">Keep the stable embed unchanged. Form fields, placement, copy, and styling update remotely after you save them in feedbacks.dev.</p>
        </div>
      </div>
      <Image className="landing-section-mascot landing-mascot-install" src="/mascots-v2/install-mechanic.png" alt="" width={1536} height={1024} sizes="(max-width: 767px) 190px, 330px" aria-hidden="true" />
    </div>
  )
}
