import Link from 'next/link'
import { CheckCircle2, Circle, Code2, Inbox, ListChecks, PlugZap, Radio, Route } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase-server'
import { PageHeader } from '@/components/ui/workspace-shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Setup Checklist' }

type ChecklistStep = {
  title: string
  description: string
  complete: boolean
  href: string
  action: string
  icon: typeof Circle
}

export default async function TutorialsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: project } = user
    ? await supabase
        .from('projects')
        .select('id,name')
        .eq('owner_user_id', user.id)
        .eq('environment', 'production')
        .is('quarantined_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const [{ data: installation }, { count: feedbackCount }, { count: triagedCount }] = project
    ? await Promise.all([
        supabase
          .from('project_embed_installations')
          .select('last_seen_at')
          .eq('project_id', project.id)
          .maybeSingle(),
        supabase
          .from('feedback')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('is_archived', false),
        supabase
          .from('feedback')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('is_archived', false)
          .neq('status', 'new'),
      ])
    : [{ data: null }, { count: 0 }, { count: 0 }]

  const projectId = project?.id
  const steps: ChecklistStep[] = [
    {
      title: 'Create a project',
      description: 'Name the app or site where feedback will be collected.',
      complete: Boolean(project),
      href: project ? `/projects/${project.id}/install` : '/projects/new',
      action: project ? 'Open project' : 'Create project',
      icon: ListChecks,
    },
    {
      title: 'Install the shared embed',
      description: 'Copy the visible publishable snippet into the app shell and load the page once.',
      complete: Boolean(installation),
      href: projectId ? `/projects/${projectId}/install` : '/projects/new',
      action: 'Open install',
      icon: Code2,
    },
    {
      title: 'Send one real test',
      description: 'Submit a recognizable message and confirm it reaches the project inbox.',
      complete: (feedbackCount || 0) > 0,
      href: projectId ? `/projects/${projectId}/verify` : '/projects/new',
      action: 'Verify connection',
      icon: Radio,
    },
    {
      title: 'Triage the first message',
      description: 'Set a useful status, priority, and tag so the workflow is proven end to end.',
      complete: (triagedCount || 0) > 0,
      href: projectId ? `/feedback?projectId=${projectId}` : '/projects/new',
      action: 'Open inbox',
      icon: Inbox,
    },
  ]
  const completed = steps.filter((step) => step.complete).length
  const nextStep = steps.find((step) => !step.complete)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Activation"
        title="Setup checklist"
        description={project
          ? `Finish one coherent path for ${project.name}. Advanced customization can wait.`
          : 'Create one project, install once, send one test, and triage it.'}
        action={nextStep && (
          <Button asChild>
            <Link href={nextStep.href}>{nextStep.action}</Link>
          </Button>
        )}
      />

      <section className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b bg-surface-raised/55 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{completed} of {steps.length} complete</p>
            <p className="text-xs text-muted-foreground">{completed === steps.length ? 'Ready to collect feedback' : 'Continue with the next incomplete step'}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-label={`${completed} of ${steps.length} setup steps complete`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${(completed / steps.length) * 100}%` }} />
          </div>
        </div>
        <ol className="divide-y">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className={cn('grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center', !step.complete && step === nextStep && 'bg-surface-selected/45')}>
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-full border', step.complete ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'bg-background text-muted-foreground')}>
                  {step.complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold">{step.title}</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
                <Button asChild variant={step.complete ? 'ghost' : 'outline'} size="sm">
                  <Link href={step.href}>{step.complete ? 'Review' : step.action}</Link>
                </Button>
              </li>
            )
          })}
        </ol>
      </section>

      {completed === steps.length && projectId && (
        <section className="rounded-lg border bg-surface-raised/35 p-5">
          <h2 className="font-semibold">Add one workflow when it becomes useful</h2>
          <p className="mt-1 text-sm text-muted-foreground">These are not required for activation.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href={`/projects/${projectId}?tab=integrations`}><PlugZap className="mr-2 h-4 w-4" />Route important feedback</Link></Button>
            <Button asChild variant="outline"><Link href={`/projects/${projectId}?tab=board`}><Route className="mr-2 h-4 w-4" />Publish a feedback page</Link></Button>
          </div>
        </section>
      )}
    </div>
  )
}
