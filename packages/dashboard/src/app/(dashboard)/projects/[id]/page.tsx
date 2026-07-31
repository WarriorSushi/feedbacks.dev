import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Project } from '@/lib/types'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { ProjectTabs } from './project-tabs'
import { toSafeWebhookConfig } from '@/lib/integration-secrets'
import { normalizeWebhookConfig } from '@/lib/webhook-config'
import { SAFE_PROJECT_COLUMNS } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Project Workspace' }

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select(SAFE_PROJECT_COLUMNS)
    .eq('id', id)
    .single()

  if (!project) notFound()

  const billingSummary = await getCurrentUserBillingSummary()

  const safeProject = {
    ...project,
    api_key: null,
    webhooks: toSafeWebhookConfig(normalizeWebhookConfig(project.webhooks)),
  } as Project

  return <ProjectTabs project={safeProject} billingSummary={billingSummary} />
}
