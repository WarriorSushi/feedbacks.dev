import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Project } from '@/lib/types'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { ProjectTabs } from './project-tabs'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const billingSummary = await getCurrentUserBillingSummary()

  return <ProjectTabs project={project as Project} billingSummary={billingSummary} />
}
