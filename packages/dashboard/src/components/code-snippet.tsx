'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/copy-button'

interface CodeTab {
  label: string
  code: string
  language: string
}

interface CodeSnippetProps {
  tabs: CodeTab[]
  className?: string
  wrap?: boolean
  maxHeightClassName?: string
  onCopied?: () => void
}

export function CodeSnippet({ tabs, className, wrap = false, maxHeightClassName, onCopied }: CodeSnippetProps) {
  const [activeTab, setActiveTab] = React.useState(0)

  return (
    <div className={cn('overflow-hidden rounded-lg border border-zinc-700/80 bg-surface-code text-zinc-100 shadow-sm', className)}>
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-zinc-700/80 bg-zinc-900/45 px-2">
        <div className="flex min-w-0 items-center">
          {tabs.length > 1 ? (
            <div className="flex min-w-0">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                    'min-h-10 border-b-2 px-3 text-xs font-medium transition-colors',
                i === activeTab
                      ? 'border-primary text-zinc-50'
                      : 'border-transparent text-zinc-400 hover:text-zinc-100'
              )}
            >
              {tab.label}
            </button>
          ))}
            </div>
          ) : (
            <span className="truncate px-2 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400">
              {tabs[activeTab].label}
            </span>
          )}
        </div>
        <CopyButton
          value={tabs[activeTab].code}
            label="Copy code"
          copiedLabel="Copied"
          size="sm"
          onCopied={onCopied}
            className="h-8 shrink-0 border border-zinc-600 bg-zinc-800 px-2.5 text-xs text-zinc-100 shadow-none hover:bg-zinc-700 hover:text-zinc-50"
        />
      </div>
      <div>
        <pre
          tabIndex={0}
          aria-label={`${tabs[activeTab].label} code`}
          className={cn(
            'p-4 text-[13px] leading-6 text-zinc-100',
            wrap ? 'overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words' : 'overflow-x-auto',
            maxHeightClassName
          )}
        >
          <code className="font-mono text-current">
            {tabs[activeTab].code}
          </code>
        </pre>
      </div>
    </div>
  )
}
