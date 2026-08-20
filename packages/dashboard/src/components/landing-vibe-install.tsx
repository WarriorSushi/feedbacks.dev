'use client'

import * as React from 'react'
import { Bot, Check, Code2, Copy, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const agentPrompt = `Add feedbacks.dev to this app. Use the browser-safe snippet from my dashboard, place the feedback host where the form should appear, and verify that a test submission reaches the inbox.`

export function LandingVibeInstall({ snippet }: { snippet: string }) {
  const [copied, setCopied] = React.useState<'code' | 'prompt' | null>(null)

  const copy = async (value: string, kind: 'code' | 'prompt') => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="landing-vibe-install overflow-hidden rounded-[1.5rem] border bg-[#0d100c] text-[#f5f7f1] shadow-[0_30px_90px_-48px_rgb(0_0_0/0.75)]">
      <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex min-h-[390px] flex-col justify-between border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#b8ff4f]"><Sparkles className="h-4 w-4" />Vibe coder mode</div>
            <h3 className="mt-6 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Built it this weekend? Get feedback before Monday.</h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">The dashboard gives you the exact snippet and an AI-ready instruction. Paste one of them. Resume naming your startup.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-zinc-400">
            {['Website', 'React + Next.js', 'AI coding agents'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#b8ff4f]" />{item}</span>)}
          </div>
        </div>

        <div className="grid min-w-0 sm:grid-rows-2">
          <div className="min-w-0 border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300"><Code2 className="h-4 w-4 text-[#b8ff4f]" />Paste it yourself</span>
              <button type="button" onClick={() => copy(snippet, 'code')} className={cn('inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/10', copied === 'code' && 'border-[#b8ff4f]/40 text-[#b8ff4f]')}><Copy className="h-3.5 w-3.5" />{copied === 'code' ? 'Copied' : 'Copy'}</button>
            </div>
            <pre className="mt-5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-6 text-zinc-400"><code>{snippet}</code></pre>
          </div>

          <div className="min-w-0 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300"><Bot className="h-4 w-4 text-[#b8ff4f]" />Or give this to your coding agent</span>
              <button type="button" onClick={() => copy(agentPrompt, 'prompt')} className={cn('inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/10', copied === 'prompt' && 'border-[#b8ff4f]/40 text-[#b8ff4f]')}><Copy className="h-3.5 w-3.5" />{copied === 'prompt' ? 'Copied' : 'Copy prompt'}</button>
            </div>
            <p className="mt-5 max-w-2xl font-mono text-xs leading-6 text-zinc-300">{agentPrompt}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
