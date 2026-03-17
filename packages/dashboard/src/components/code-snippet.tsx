'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CodeTab {
  label: string
  code: string
  language: string
}

interface CodeSnippetProps {
  tabs: CodeTab[]
  className?: string
}

export function CodeSnippet({ tabs, className }: CodeSnippetProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tabs[activeTab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-muted', className)}>
      {tabs.length > 1 && (
        <div className="flex border-b bg-muted/50">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                i === activeTab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <pre className="overflow-x-auto p-4 text-sm">
          <code className="font-mono text-foreground">
            {tabs[activeTab].code}
          </code>
        </pre>
      </div>
    </div>
  )
}
