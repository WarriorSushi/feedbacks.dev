import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/lib/types'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Code2, FolderOpen, Inbox, LockKeyhole, Plus, Settings, Trash2 } from 'lucide-react'
import { cookies } from 'next/headers'
import { CURRENT_PROJECT_COOKIE, getSelectedProject } from '@/lib/project-selection'
import { PageHeader } from '@/components/ui/workspace-shell'

export const metadata = { title: 'Projects' }

type ProjectHealth = {
  project_id: string
  feedback_count: number
  unread_count: number
  latest_feedback_at: string | null
  embed_last_seen_at: string | null
  failed_delivery_count: number
  board_enabled: boolean
  board_visibility: string | null
  board_listed: boolean
  updates_enabled: boolean
}

function nextProjectAction(project: Project, health?: ProjectHealth) {
  if (project.plan_frozen_at) {
    return { label: 'Restore with Pro', href: '/billing', tone: 'attention' as const }
  }
  if (!health?.embed_last_seen_at) {
    return { label: 'Install', href: `/projects/${project.id}/install`, tone: 'primary' as const }
  }
  if (!health.feedback_count) {
    return { label: 'Verify', href: `/projects/${project.id}/verify`, tone: 'primary' as const }
  }
  if (health.failed_delivery_count > 0) {
    return { label: 'Fix delivery', href: `/projects/${project.id}?tab=integrations`, tone: 'danger' as const }
  }
  return {
    label: health.unread_count > 0 ? `Review ${health.unread_count} unread` : 'Open inbox',
    href: `/feedback?projectId=${project.id}`,
    tone: health.unread_count > 0 ? 'attention' as const : 'default' as const,
  }
}

export default async function ProjectsPage() {
  const cookieStore = await cookies()
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const billingSummary = await getCurrentUserBillingSummary()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: projectHealth } = await supabase.rpc('get_owner_project_health')
  const healthMap = new Map(
    ((projectHealth || []) as ProjectHealth[]).map((health) => [health.project_id, health]),
  )
  const currentProjectId = getSelectedProject((projects as Project[] | null) || [], cookieStore.get(CURRENT_PROJECT_COOKIE)?.value)?.id

  return (
    <div data-tour="project-surface" className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description={billingSummary
          ? `${billingSummary.entitlements.label} plan · ${billingSummary.usage.projectCount}${billingSummary.entitlements.projectLimit ? ` of ${billingSummary.entitlements.projectLimit} projects used` : ' projects'}`
          : 'Manage each product connection.'}
        action={
          <Button asChild>
            <Link href="/projects/new" data-tour="new-project"><Plus className="mr-2 h-4 w-4" />New project</Link>
          </Button>
        }
      />

      {billingSummary?.entitlements.projectLimit &&
        billingSummary.usage.projectCount >= billingSummary.entitlements.projectLimit && (
          <Card className="border-primary/30 bg-primary/[0.04]">
            <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Free plan project limit reached</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro to create more projects without deleting existing ones.
                </p>
              </div>
              <Link href="/billing">
                <Button variant="outline">Open Billing</Button>
              </Link>
            </CardContent>
          </Card>
        )}

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
              Create one project, install the shared embed once, then send one test feedback item.
            </p>
            <div className="mt-5 grid w-full max-w-md gap-2 text-left sm:grid-cols-3">
              {['Create project', 'Install and test', 'Manage remotely'].map((step, index) => (
                <div key={step} className="rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                  <span className="mr-1 font-semibold text-primary">{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
            <Link href="/projects/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create your first project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
          {(projects as Project[]).map((project) => {
            const health = healthMap.get(project.id)
            const next = nextProjectAction(project, health)
            return (
            <div
              key={project.id}
              className="grid gap-3 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-accent/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <Link
                href={next.href}
                className="group min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                  <h2 className="truncate text-base font-semibold">{project.name}</h2>
                  {project.id === currentProjectId && <Badge variant="outline">Current</Badge>}
                  {project.plan_frozen_at && <Badge variant="secondary"><LockKeyhole className="mr-1 h-3 w-3" />Frozen</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{project.domain || 'No domain set'}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                  <span>Created {formatDate(project.created_at)}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                  <span className="inline-flex items-center gap-1">
                    {health?.embed_last_seen_at
                      ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Embed seen {formatDate(health.embed_last_seen_at)}</>
                      : <><Code2 className="h-3 w-3" /> Embed not detected</>}
                  </span>
                  {health?.board_enabled && (
                    <span>{health.board_listed ? 'Board listed' : 'Board unlisted'}</span>
                  )}
                  {health?.updates_enabled && <span>Updates active</span>}
                  {project.plan_frozen_at && <span>Data preserved, public collection paused</span>}
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Badge variant="secondary">
                  <Inbox className="mr-1 h-3 w-3" />
                  {health?.feedback_count || 0} feedback
                </Badge>
                <Button
                  variant={next.tone === 'danger' ? 'destructive' : 'outline'}
                  size="sm"
                  asChild
                >
                  <Link href={next.href}>
                    {next.tone === 'danger' && <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />}
                    {next.label}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${project.id}/settings`}>
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  asChild
                >
                  <Link href={`/projects/${project.id}/settings#delete-project`}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Link>
                </Button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
