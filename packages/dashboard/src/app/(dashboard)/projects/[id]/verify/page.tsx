import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { publicEnv } from '@/lib/public-env'
import type { Project } from '@/lib/types'
import { ProjectVerifyClient } from '../project-verify-client'

export default async function ProjectVerifyPage({
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

  return (
    <ProjectVerifyClient
      appOrigin={publicEnv.NEXT_PUBLIC_APP_ORIGIN}
      projectId={project.id}
      projectKey={project.api_key}
      projectName={project.name}
      savedConfig={(project as Project).settings?.widget_config || {}}
    />
  )
}
