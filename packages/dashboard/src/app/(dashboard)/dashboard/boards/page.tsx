import Link from 'next/link'
import { cookies } from 'next/headers'
import { ArrowRight, ExternalLink, Globe, Settings2 } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMarketingOrigin } from '@/lib/domain-routing'
import { CURRENT_PROJECT_COOKIE } from '@/lib/project-selection'
import { PageHeader } from '@/components/ui/workspace-shell'

export const metadata = { title: 'Your Public Boards' }

export default async function DashboardBoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const publicBoardsUrl = `${getMarketingOrigin()}/boards`
  const requestedProjectId = (await searchParams).project
  const storedProjectId = (await cookies()).get(CURRENT_PROJECT_COOKIE)?.value
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = user
    ? await supabase
        .from('projects')
        .select('id, name, domain, created_at')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const selectedProject = (projects || []).find((project) => project.id === (requestedProjectId || storedProjectId)) || projects?.[0]
  const { data: board } = selectedProject
    ? await supabase
        .from('public_board_settings')
        .select('project_id, enabled, slug, visibility, directory_opt_in, updated_at')
        .eq('project_id', selectedProject.id)
        .maybeSingle()
    : { data: null }
  const { count: publicRequestCount } = selectedProject
    ? await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', selectedProject.id)
        .eq('is_public', true)
        .eq('is_archived', false)
    : { count: 0 }
  const { count: openReportCount } = selectedProject
    ? await supabase
        .from('board_reports')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', selectedProject.id)
        .eq('status', 'open')
    : { count: 0 }

  const published = Boolean(board?.enabled && board.slug && board.visibility !== 'private')
  const state = (openReportCount || 0) > 0
    ? 'Needs moderation'
    : !board
      ? 'Disabled'
      : !published
        ? 'Draft'
        : board.directory_opt_in && board.visibility === 'public'
          ? 'Published · listed'
          : 'Published · unlisted'

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-tour="owner-boards">
      <div data-tour="owner-boards-summary">
        <PageHeader
          eyebrow="Public feedback page"
          title={selectedProject ? selectedProject.name : 'Your public page'}
          description="Let users share ideas, vote, and see your replies."
          action={<Button variant="outline" asChild>
            <a href={publicBoardsUrl}>
            <Globe className="mr-2 h-4 w-4" />
            See public pages
            </a>
          </Button>}
        />
      </div>

      {!selectedProject ? (
        <div className="rounded-lg border bg-card p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
          <h2 className="text-lg font-semibold">Create a project first</h2>
          <p className="mt-2 text-sm text-muted-foreground">Each public page belongs to one project.</p>
          <Button className="mt-5" asChild><Link href="/projects/new">Create project</Link></Button>
        </div>
      ) : (
        <div data-tour="owner-board-list" className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-semibold">{selectedProject.name}</h2>
                <Badge variant={(openReportCount || 0) > 0 ? 'destructive' : published ? 'default' : 'secondary'}>{state}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedProject.domain || 'No domain set'} · {publicRequestCount || 0} public requests
                {(openReportCount || 0) > 0 && ` · ${openReportCount} open report${openReportCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {published && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/p/${board!.slug}`} target="_blank" rel="noopener noreferrer">
                    Preview <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/projects/${selectedProject.id}?tab=board`}>
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                  {board ? 'Edit page' : 'Make public page'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
        Open all projects <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
