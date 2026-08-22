'use client'

import * as React from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

export function EarlyAdopterFeedbackForm({ nextMonth }: { nextMonth: number }) {
  const router = useRouter()
  const [good, setGood] = React.useState('')
  const [bad, setBad] = React.useState('')
  const [improve, setImprove] = React.useState('')
  const [anythingElse, setAnythingElse] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [complete, setComplete] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/early-adopter/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ good, bad, improve, anythingElse }),
      })
      const payload = await response.json() as { renewed?: boolean; error?: string; complimentaryProUntil?: string }
      if (!response.ok || !payload.renewed) throw new Error(payload.error || 'Your check-in could not be renewed.')
      setComplete(true)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Your check-in could not be renewed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (complete) {
    return (
      <div className="border-y border-primary/30 bg-primary/[0.06] px-5 py-10 text-center sm:rounded-lg sm:border sm:px-8">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Feedback received. Pro month {nextMonth} is active.</h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">Thank you for being specific. Your next check-in opens near the end of this new month, and we will email you when it is ready.</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>View updated programme status <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="divide-y rounded-lg border bg-card shadow-sm">
      {[
        { id: 'programme-good', label: 'What is working well in feedbacks.dev?', value: good, setValue: setGood, placeholder: 'Tell us what feels useful, clear, fast, or trustworthy.' },
        { id: 'programme-bad', label: 'What is not working well?', value: bad, setValue: setBad, placeholder: 'Tell us what feels confusing, slow, unreliable, or unnecessary.' },
        { id: 'programme-improve', label: 'What should we improve next?', value: improve, setValue: setImprove, placeholder: 'Name the change that would make the product more valuable to you.' },
      ].map((field) => (
        <div key={field.id} className="space-y-3 p-5 sm:p-6">
          <Label htmlFor={field.id} className="text-base">{field.label}</Label>
          <Textarea id={field.id} value={field.value} onChange={(event) => field.setValue(event.target.value)} minLength={3} maxLength={2000} rows={5} placeholder={field.placeholder} required className="text-base leading-6" />
        </div>
      ))}
      <div className="space-y-3 p-5 sm:p-6">
        <Label htmlFor="programme-other" className="text-base">Anything else? <span className="font-normal text-muted-foreground">Optional</span></Label>
        <Textarea id="programme-other" value={anythingElse} onChange={(event) => setAnythingElse(event.target.value)} maxLength={2000} rows={4} placeholder="A question, idea, concern, or example we should see." className="text-base leading-6" />
      </div>
      <div className="p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">Submitting this complete check-in activates Pro month {nextMonth} of 12. Your response is private and reaches the feedbacks.dev product inbox.</p>
        <Button type="submit" size="lg" disabled={submitting || good.trim().length < 3 || bad.trim().length < 3 || improve.trim().length < 3} className="mt-4 w-full sm:mt-0 sm:w-auto">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send feedback and activate month {nextMonth}
        </Button>
      </div>
      {error ? <p role="alert" className="border-t border-destructive/30 bg-destructive/5 px-5 py-3 text-sm text-destructive sm:px-6">{error}</p> : null}
    </form>
  )
}
