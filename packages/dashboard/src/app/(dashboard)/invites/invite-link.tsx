'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, Mail } from 'lucide-react'

export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  const subject = encodeURIComponent('Try feedbacks.dev with me')
  const body = encodeURIComponent(`I’m using feedbacks.dev to collect product feedback and share updates. Create your free project here: ${url}`)
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="min-w-0 flex-1 truncate rounded-md border bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground">{url}</div>
      <Button type="button" onClick={copy} className="sm:w-28">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? 'Copied' : 'Copy link'}</Button>
      <Button variant="outline" asChild><a href={`mailto:?subject=${subject}&body=${body}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>
    </div>
  )
}
