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

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  // Extract current project ID from URL path
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const projectMatch = pathname.match(/\/projects\/([^/]+)/)
  const currentProjectId = projectMatch?.[1] || undefined

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          email: user.email,
          user_metadata: user.user_metadata as { avatar_url?: string; full_name?: string },
        }}
        projects={(projects as Project[]) || []}
        currentProjectId={currentProjectId}
      />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
