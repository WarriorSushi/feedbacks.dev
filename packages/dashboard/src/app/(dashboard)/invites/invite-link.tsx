'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, Copy, Mail } from 'lucide-react'

export function InviteLink({ url }: { url: string }) {
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const resetTimer = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
  }, [])

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
        if (!document.execCommand('copy')) throw new Error('Copy unavailable')
      }
      setCopyState('copied')
    } catch {
      inputRef.current?.focus()
      inputRef.current?.select()
      setCopyState('error')
    }
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 2200)
  }
  const subject = encodeURIComponent('Try feedbacks.dev with me')
  const body = encodeURIComponent(`I’m using feedbacks.dev to collect product feedback and share updates. Create your free project here: ${url}`)
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          aria-label="Personal invite link"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="min-h-10 min-w-0 flex-1 truncate rounded-md border bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary/45 focus:ring-2 focus:ring-ring/35"
        />
        <Button type="button" onClick={() => void copy()} className="sm:w-28">
          {copyState === 'copied' ? <Check className="mr-2 h-4 w-4" /> : copyState === 'error' ? <AlertCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Select link' : 'Copy link'}
        </Button>
        <Button variant="outline" asChild><a href={`mailto:?subject=${subject}&body=${body}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>
      </div>
      <p className="mt-2 min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {copyState === 'copied' && 'Invite link copied.'}
        {copyState === 'error' && 'Automatic copy is unavailable. The link is selected so you can copy it manually.'}
      </p>
    </div>
  )
}
