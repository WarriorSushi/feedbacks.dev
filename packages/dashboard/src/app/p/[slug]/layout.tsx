import type { Metadata } from 'next'
import { BrandWordmark } from '@/components/brand-wordmark'
import { Sidebar } from '@/components/sidebar'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Feature Board | feedbacks.dev',
  description: 'Vote on features and share your feedback',
}

export default function PublicBoardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  return <PublicBoardShell params={params}>{children}</PublicBoardShell>
}

async function PublicBoardShell({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, supabase, admin] = await Promise.all([
    params,
    createServerSupabase(),
    createAdminSupabase(),
  ])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const [{ data: projects }, { data: boardSettings }, { data: currentBoard }] =
      await Promise.all([
        supabase
          .from('projects')
          .select('id, name, settings')
          .eq('owner_user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('public_board_settings')
          .select('project_id, slug, enabled')
          .eq('enabled', true),
        admin
          .from('public_board_settings')
          .select('project_id')
          .eq('slug', slug)
          .eq('enabled', true)
          .maybeSingle(),
      ])

    const ownedProjects = (projects as Array<{ id: string; name: string; settings: { icon?: string } }>) || []
    const ownsCurrentProject = ownedProjects.some((project) => project.id === currentBoard?.project_id)
    const boardSlugs: Record<string, string> = {}
    boardSettings?.forEach((board: { project_id: string; slug: string }) => {
      boardSlugs[board.project_id] = board.slug
    })

    return (
      <div className="flex h-dvh flex-col bg-background md:flex-row">
        <Sidebar
          user={{
            email: user.email,
            user_metadata: user.user_metadata as { avatar_url?: string; full_name?: string },
          }}
          projects={ownedProjects}
          currentProjectId={ownsCurrentProject ? currentBoard?.project_id : undefined}
          boardSlugs={boardSlugs}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/35 pb-[env(safe-area-inset-bottom,0px)] dark:bg-background">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {children}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <span>Powered by</span>
          <a
            href="https://www.feedbacks.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            <BrandWordmark markClassName="h-4 w-4" dotClassName="text-current" />
          </a>
        </div>
      </footer>
    </div>
  )
}
