import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { Sidebar } from '@/components/sidebar'
import type { Project } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [{ data: projects }, { data: boardSettings }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('public_board_settings')
      .select('project_id, slug, enabled')
      .eq('enabled', true),
  ])

  // Extract current project ID from URL path
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const projectMatch = pathname.match(/\/projects\/([^/]+)/)
  const currentProjectId = projectMatch?.[1] || undefined

  // Build project → board slug map
  const boardSlugs: Record<string, string> = {}
  boardSettings?.forEach((b: { project_id: string; slug: string }) => {
    boardSlugs[b.project_id] = b.slug
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          email: user.email,
          user_metadata: user.user_metadata as { avatar_url?: string; full_name?: string },
        }}
        projects={(projects as Project[]) || []}
        currentProjectId={currentProjectId}
        boardSlugs={boardSlugs}
      />
      <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">{children}</div>
      </main>
    </div>
  )
}
