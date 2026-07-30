'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Check, Code2, FolderOpen, Globe, Inbox, MessageSquare, Webhook } from 'lucide-react'
import { GUIDED_TUTORIAL_PROGRESS_KEY, GUIDED_TUTORIALS, resolveTutorialHref, type GuidedTutorialId } from '@/lib/guided-tutorials'
import { cn } from '@/lib/utils'

interface ProgressEntry {
  stepIndex: number
  completedAt?: string
  dismissedAt?: string
}

const EMPTY_PROGRESS: Record<string, ProgressEntry> = {}

const icons: Record<GuidedTutorialId, React.ComponentType<{ className?: string }>> = {
  navigation: BookOpen,
  'create-project': FolderOpen,
  'customize-form': MessageSquare,
  'install-widget': Code2,
  'triage-inbox': Inbox,
  'publish-board': Globe,
  'connect-routing': Webhook,
}

function tutorialHref(id: GuidedTutorialId, href: string, projectId?: string) {
  const resolved = resolveTutorialHref(href, projectId)
  return `${resolved}${resolved.includes('?') ? '&' : '?'}tutorial=${id}`
}

export function TutorialCenter({
  defaultProjectId,
  initialProgress = EMPTY_PROGRESS,
}: {
  defaultProjectId?: string
  initialProgress?: Record<string, ProgressEntry>
}) {
  const [progress, setProgress] = React.useState<Record<string, ProgressEntry>>(initialProgress)

  React.useEffect(() => {
    const load = () => {
      try {
        const local = JSON.parse(window.localStorage.getItem(GUIDED_TUTORIAL_PROGRESS_KEY) || '{}')
        setProgress({ ...initialProgress, ...local })
      } catch {
        setProgress({})
      }
    }
    load()
    window.addEventListener('feedbacks:tutorial-progress', load)
    return () => window.removeEventListener('feedbacks:tutorial-progress', load)
  }, [initialProgress])

  const completed = GUIDED_TUTORIALS.filter((tutorial) => progress[tutorial.id]?.completedAt).length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="max-w-2xl rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Tutorials</p>
        <h1 className="mt-2 text-2xl font-bold">Learn one job at a time</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Each lesson opens the real product, dims the screen, and points to the exact control being explained.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Your progress</p>
          <p className="mt-1 text-sm text-muted-foreground">{completed} of {GUIDED_TUTORIALS.length} tutorials completed</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:max-w-xs" aria-label={`${completed} of ${GUIDED_TUTORIALS.length} tutorials completed`}>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${(completed / GUIDED_TUTORIALS.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GUIDED_TUTORIALS.map((tutorial) => {
          const Icon = icons[tutorial.id]
          const saved = progress[tutorial.id]
          const isComplete = Boolean(saved?.completedAt)
          const canResume = Boolean(saved && !isComplete && saved.stepIndex > 0)
          const needsProject = tutorial.steps.some((step) => step.href.includes('{projectId}'))
          const disabled = needsProject && !defaultProjectId
          const href = tutorialHref(tutorial.id, tutorial.steps[0].href, defaultProjectId)

          return (
            <article key={tutorial.id} className="flex min-h-48 flex-col rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {isComplete && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="h-3.5 w-3.5" /> Completed</span>}
              </div>
              <h2 className="mt-4 text-sm font-semibold">{tutorial.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{tutorial.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{tutorial.steps.length} steps</span>
                {disabled ? (
                  <Link href="/projects/new" className="text-sm font-semibold text-primary">Create a project first</Link>
                ) : (
                  <Link href={href} className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold', isComplete ? 'border' : 'bg-primary text-primary-foreground')}>
                    {isComplete ? 'Retake' : canResume ? 'Resume' : 'Start'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
