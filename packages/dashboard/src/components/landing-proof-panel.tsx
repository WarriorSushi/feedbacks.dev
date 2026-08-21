'use client'

import * as React from 'react'
import { Check, Clipboard, Code2, Inbox, Megaphone, Paperclip } from 'lucide-react'

export function LandingProofPanel({ installSnippet }: { installSnippet: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(installSnippet)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-foreground/15 bg-card shadow-[var(--shadow-float)]" aria-label="A project moving from install to feedback to a user update">
      <header className="flex items-center justify-between border-b bg-[oklch(var(--surface-raised))] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-sm font-black text-primary">A</span>
          <div className="min-w-0"><p className="truncate text-xs font-semibold">ACME App</p><p className="text-[10px] text-muted-foreground">Production project</p></div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Connected</span>
      </header>

      <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
        <section className="min-w-0 border-b lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold"><Code2 className="h-3.5 w-3.5 text-primary" />Install once</p>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground" aria-live="polite">
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Clipboard className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="max-h-44 overflow-auto bg-[oklch(var(--surface-inset))] p-4 text-[10px] leading-5 text-foreground sm:text-[11px]" aria-label="Website installation snippet"><code>{installSnippet}</code></pre>
          <p className="border-t px-4 py-3 text-[10px] leading-4 text-muted-foreground">The browser receives only a publishable project key. Form changes load remotely.</p>
        </section>

        <section className="min-w-0">
          <div className="flex items-center justify-between border-b px-4 py-3"><p className="flex items-center gap-2 text-xs font-semibold"><Inbox className="h-3.5 w-3.5 text-primary" />Useful context arrives</p><span className="text-[10px] text-muted-foreground">just now</span></div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Export hangs after changing date range</p><p className="mt-1 text-xs leading-5 text-muted-foreground">“The button keeps spinning after I select the last 90 days.”</p></div><span className="shrink-0 rounded border border-rose-500/20 bg-rose-500/[0.07] px-2 py-1 text-[9px] font-semibold text-rose-600 dark:text-rose-400">BUG</span></div>
            <dl className="mt-4 grid grid-cols-[82px_1fr] gap-x-3 gap-y-2 border-y py-3 text-[10px]">
              <dt className="text-muted-foreground">Page</dt><dd className="truncate font-mono">/reports/export</dd>
              <dt className="text-muted-foreground">Browser</dt><dd>Edge 128 · Windows</dd>
              <dt className="text-muted-foreground">Attachment</dt><dd className="flex items-center gap-1"><Paperclip className="h-3 w-3" />Screenshot included</dd>
            </dl>
            <div className="mt-4 flex items-center justify-between"><span className="text-[10px] font-medium text-primary">Ready to triage</span><span className="rounded bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">High priority</span></div>
          </div>
        </section>
      </div>

      <footer className="grid grid-cols-3 border-t bg-[oklch(var(--surface-raised))] text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 px-3 py-3 sm:px-4"><Code2 className="h-3.5 w-3.5 text-primary" /><span><strong>1.</strong> Install</span></div>
        <div className="flex items-center gap-1.5 border-l px-3 py-3 sm:px-4"><Inbox className="h-3.5 w-3.5 text-primary" /><span><strong>2.</strong> Triage</span></div>
        <div className="flex items-center gap-1.5 border-l px-3 py-3 sm:px-4"><Megaphone className="h-3.5 w-3.5 text-primary" /><span><strong>3.</strong> Show what shipped</span></div>
      </footer>
    </div>
  )
}
