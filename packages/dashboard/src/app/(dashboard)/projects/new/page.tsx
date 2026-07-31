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
import { FieldError, FormErrorSummary } from '@/components/ui/field-error'
import { readErrorMessage, readFieldErrors, type FieldErrors } from '@/lib/form-errors'

export default function NewProjectPage() {
  const [name, setName] = React.useState('')
  const [domain, setDomain] = React.useState('')
  const [icon, setIcon] = React.useState<string>(DEFAULT_PROJECT_ICON)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [limitMessage, setLimitMessage] = React.useState('')
  const creationRequestId = React.useRef('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setFieldErrors({})
    setLimitMessage('')
    if (!creationRequestId.current && typeof crypto.randomUUID === 'function') {
      creationRequestId.current = crypto.randomUUID()
    }

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
          creationRequestId: creationRequestId.current || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        if (payload.code === 'project_limit_reached') {
          setLimitMessage(payload.error || 'Free plan includes 2 projects. Upgrade to Pro to create more.')
        }
        setFieldErrors(readFieldErrors(payload))
        setError(readErrorMessage(payload, 'The project could not be created. Check your connection and try again.'))
        return
      }

      if (payload.api_key) {
        rememberProjectApiKey(payload.id, payload.api_key)
      }
      router.push(`/projects/${payload.id}/install?created=1`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The project could not be created. Check your connection and try again.')
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
                onChange={(e) => { setName(e.target.value); setFieldErrors((current) => ({ ...current, name: '' })) }}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'project-name-error' : 'project-name-help'}
                required
                autoFocus
                maxLength={80}
                className="h-12 text-base"
              />
              <p id="project-name-help" className="text-xs text-muted-foreground">
                Use the name your users know. You can change it later.
              </p>
              <FieldError id="project-name-error">{fieldErrors.name}</FieldError>
            </div>

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
                          onClick={() => { setIcon(option.emoji); setFieldErrors((current) => ({ ...current, icon: '' })) }}
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
                  <FieldError id="project-icon-error">{fieldErrors.icon}</FieldError>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (optional)</Label>
                  <Input
                    id="domain"
                    placeholder="myapp.com"
                    value={domain}
                    onChange={(e) => { setDomain(e.target.value); setFieldErrors((current) => ({ ...current, domain: '' })) }}
                    aria-invalid={Boolean(fieldErrors.domain)}
                    aria-describedby={fieldErrors.domain ? 'project-domain-error' : 'project-domain-help'}
                  />
                  <p id="project-domain-help" className="text-xs text-muted-foreground">
                    You do not need this to set up the feedback form.
                  </p>
                  <FieldError id="project-domain-error">{fieldErrors.domain}</FieldError>
                </div>
              </div>
            </details>
            <FormErrorSummary>{error}</FormErrorSummary>
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
              Create project and get the snippet
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="text-center text-xs leading-5 text-muted-foreground">Next: copy the snippet and verify one test.</p>
      </form>
      </CardContent>
      </Card>
    </div>
  )
}
