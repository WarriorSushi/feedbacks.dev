'use client'

import * as React from 'react'
import { Bot, Code2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const agentPrompt = `Install feedbacks.dev in this project using the project-specific setup details from my dashboard.

1. Identify the shared app shell or root layout where the browser-safe embed should load once.
2. Add the exact dashboard-generated snippet without exposing private API keys or server credentials.
3. Keep the stable embed unchanged so future form and placement settings continue to update remotely.
4. Run the app locally and confirm the feedback trigger appears without layout shift or console errors.
5. Submit one test report from the real page and verify that its URL and browser context reach the feedbacks.dev inbox.
6. Summarize the files changed, the placement used, and the verification result.`

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
        <div className="flex min-h-[390px] items-center border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <h3 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Install it yourself, or hand it to your coding agent.</h3>
            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">Your dashboard generates the project-specific snippet and a complete setup instruction. Copy either one, paste it where you work, and verify the first report.</p>
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
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300"><Bot className="h-4 w-4 text-[#b8ff4f]" />Generated in your dashboard</span>
              <button type="button" onClick={() => copy(agentPrompt, 'prompt')} className={cn('inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/10', copied === 'prompt' && 'border-[#b8ff4f]/40 text-[#b8ff4f]')}><Copy className="h-3.5 w-3.5" />{copied === 'prompt' ? 'Copied' : 'Copy agent instruction'}</button>
            </div>
            <pre className="mt-5 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-zinc-300"><code>{agentPrompt}</code></pre>
          </div>
        </div>
      </div>
    </div>
  )
}
