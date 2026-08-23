import Link from 'next/link'
import { ArrowRight, Check, Code2, FormInput, Megaphone } from 'lucide-react'
import type { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionPanel, StatusDot } from '@/components/ui/workspace-shell'

export function ProjectHome({ project }: { project: Project }) {
  const feedbackEnabled = project.settings?.widget_config?.feedbackEnabled !== false

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.name}
        title="Project overview"
        description="Collect feedback and show users what changed through one installed connection."
        action={
          <Button asChild>
            <Link href={`/projects/${project.id}/install`}>
              Install or test
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <SectionPanel title="User communication" description="Choose the product surface you want to work on.">
        <div className="-m-5 divide-y">
          <ProductLane
            icon={<FormInput className="h-4 w-4" />}
            direction="Users to your team"
            title="Feedback form"
            description="Control the in-product form and collect technical context with each message."
            status={feedbackEnabled ? 'Enabled' : 'Disabled'}
            href={`/projects/${project.id}/feedback-form`}
            action="Customize form"
          />
          <ProductLane
            icon={<Megaphone className="h-4 w-4" />}
            direction="Your team to users"
            title="Product updates"
            description="Publish concise release notes inside the product."
            href={`/projects/${project.id}/release-notes`}
            action="Manage updates"
          />
        </div>
      </SectionPanel>

      <div className="flex flex-col gap-4 rounded-lg border bg-surface-raised/55 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background"><Code2 className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-semibold">One stable connection</h2>
            <p className="mt-1 text-sm text-muted-foreground">Save changes here. The installed snippet does not change.</p>
          </div>
        </div>
        <ol className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {['Copy embed', 'Test in product', 'Manage remotely'].map((label) => (
            <li key={label} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{label}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function ProductLane({
  icon,
  direction,
  title,
  description,
  status,
  href,
  action,
}: {
  icon: React.ReactNode
  direction: string
  title: string
  description: string
  status?: string
  href: string
  action: string
}) {
  return (
    <Link href={href} className="group grid gap-4 px-5 py-5 transition-colors hover:bg-surface-raised/55 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {status && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><StatusDot tone={status === 'Enabled' ? 'success' : 'neutral'} />{status}</span>}
        </div>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{direction}</p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        {action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
