'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { rememberProjectApiKey } from '@/lib/project-api-keys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DEFAULT_PROJECT_ICON, PROJECT_ICONS } from '@/lib/project-icons'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const productChoices = [
  { value: 'feedback', label: 'Feedback form', body: 'Let users send bugs and ideas.' },
  { value: 'updates', label: 'Messages for users', body: 'Show users what you shipped.' },
  { value: 'both', label: 'Both', body: 'Collect feedback and show fixes.' },
] as const

export default function NewProjectPage() {
  const [name, setName] = React.useState('')
  const [domain, setDomain] = React.useState('')
  const [icon, setIcon] = React.useState<string>(DEFAULT_PROJECT_ICON)
  const [goal, setGoal] = React.useState<'updates' | 'feedback' | 'both'>('feedback')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [limitMessage, setLimitMessage] = React.useState('')
  const router = useRouter()

  React.useEffect(() => {
    const requestedGoal = new URLSearchParams(window.location.search).get('goal')
    if (requestedGoal === 'updates' || requestedGoal === 'feedback' || requestedGoal === 'both') {
      setGoal(requestedGoal)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setLimitMessage('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || null,
          icon,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        if (payload.code === 'project_limit_reached') {
          setLimitMessage(payload.error || 'Free plan includes 2 projects. Upgrade to Pro to create more.')
        }
        setError(payload.error || 'Failed to create project')
        return
      }

      if (payload.api_key) {
        rememberProjectApiKey(payload.id, payload.api_key)
      }
      const modulesResponse = await fetch(`/api/projects/${payload.id}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: goal !== 'updates',
          updates: goal !== 'feedback',
        }),
      })
      if (!modulesResponse.ok) {
        const modulePayload = await modulesResponse.json().catch(() => null)
        throw new Error(modulePayload?.error || 'Project created, but the product choice could not be saved.')
      }
      const destination = goal === 'feedback'
        ? `/projects/${payload.id}/install?created=1`
        : goal === 'updates'
          ? `/projects/${payload.id}/release-notes`
          : `/projects/${payload.id}`
      router.push(destination)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <Card className="mt-6">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">New project</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Name your app or website</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">One name is enough. The recommended install snippet comes next.</p>
      </CardHeader>

      <CardContent>
      <form data-tour="project-create-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">App or website name</Label>
              <Input
                id="name"
                placeholder="For example: Acme"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                maxLength={80}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Use the name your users know. You can change it later.
              </p>
            </div>

            <details className="overflow-hidden rounded-lg border bg-[oklch(var(--surface-raised))] px-4">
              <summary className="cursor-pointer py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                Choose a different first goal <span className="font-normal">· {productChoices.find((choice) => choice.value === goal)?.label}</span>
              </summary>
              <fieldset className="space-y-2 border-t py-4">
                <legend className="sr-only">First tool</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {productChoices.map(({ value, label, body }) => (
                    <button key={value} type="button" onClick={() => setGoal(value)} className={cn('min-h-20 rounded-lg border px-3 py-3 text-left transition-colors', goal === value ? 'border-primary bg-primary/[0.055]' : 'border-border hover:bg-muted/30')} aria-label={label} aria-pressed={goal === value}>
                      <span className={cn('block text-sm font-semibold', goal === value && 'text-primary')}>{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{body}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </details>

            <details className="overflow-hidden rounded-lg border bg-[oklch(var(--surface-raised))] px-4">
              <summary className="cursor-pointer py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                Add project details <span className="font-normal">· optional</span>
              </summary>
              <div className="space-y-5 border-t py-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Project icon</legend>
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                    {PROJECT_ICONS.map((option) => {
                      const selected = icon === option.emoji
                      return (
                        <button
                          key={option.emoji}
                          type="button"
                          onClick={() => setIcon(option.emoji)}
                          className={cn(
                            'relative flex h-10 items-center justify-center rounded-md border text-lg transition-colors',
                            'hover:border-primary/40 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected && 'border-primary/50 bg-primary/[0.09]'
                          )}
                          aria-label={`${option.label} icon`}
                          aria-pressed={selected}
                          title={option.label}
                        >
                          <span aria-hidden="true">{option.emoji}</span>
                          {selected && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">This makes projects easier to spot in the menu.</p>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (optional)</Label>
                  <Input
                    id="domain"
                    placeholder="myapp.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You do not need this to set up the feedback form.
                  </p>
                </div>
              </div>
            </details>
            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}
            {limitMessage && (
              <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
                <p className="text-sm font-medium text-foreground">Free plan project limit reached</p>
                <p className="mt-1 text-sm text-muted-foreground">{limitMessage}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/billing">
                    <Button type="button" variant="outline" size="sm">Open Billing</Button>
                  </Link>
                  <Link href="/projects">
                    <Button type="button" variant="ghost" size="sm">Back to projects</Button>
                  </Link>
                </div>
              </div>
            )}
            <Button data-tour="project-create-submit" type="submit" size="lg" className="h-12 w-full gap-2" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal === 'updates' ? 'Create project and write an update' : goal === 'both' ? 'Create project' : 'Create project and get the snippet'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="text-center text-xs leading-5 text-muted-foreground">Next: copy the snippet and verify one test.</p>
      </form>
      </CardContent>
      </Card>
    </div>
  )
}
