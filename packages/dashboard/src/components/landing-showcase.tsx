'use client'

import * as React from 'react'
import { Bot, Check, Code2, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

type LandingShowcaseProps = {
  websiteSnippet: string
  agentPrompt: string
}

export function LandingShowcase({ websiteSnippet, agentPrompt }: LandingShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState<'snippet' | 'agent'>('snippet')

  return (
    <div className="landing-premium-card overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/[0.08]">
      <div className="flex flex-wrap gap-2 border-b bg-muted/35 p-2">
        {[
          { id: 'snippet' as const, label: 'Install snippet', Icon: Code2 },
          { id: 'agent' as const, label: 'Agent handoff', Icon: Bot },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'snippet' ? (
        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_230px] lg:p-5">
          <CodeWindow title="website-snippet.html" label="Copy into your app shell">
            {websiteSnippet}
          </CodeWindow>

          <div className="rounded-xl border bg-background p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-4 w-4" />
            </div>
            <p className="mt-4 text-sm font-semibold">First run stays small</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {['Create project', 'Paste snippet', 'Verify one report'].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-primary/10 p-3 text-xs font-medium text-primary">
              React and Vue examples stay available after the Website snippet works.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_250px] lg:p-5">
          <CodeWindow title="agent-handoff.md" label="Give this to your coding agent">
            {agentPrompt}
          </CodeWindow>

          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm font-semibold">What the agent receives</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                'Project key and endpoint',
                'Website snippet',
                'Verification task',
                'Inbox check for the first report',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">
              Planned flow: authorize once, hand off a scoped setup packet, verify the result.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CodeWindow({
  title,
  label,
  children,
}: {
  title: string
  label: string
  children: string
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs text-zinc-500">{title}</p>
        <div className="w-12" />
      </div>
      <div className="p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
        <pre className="h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-xs leading-relaxed sm:h-52 sm:text-sm">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  )
}
