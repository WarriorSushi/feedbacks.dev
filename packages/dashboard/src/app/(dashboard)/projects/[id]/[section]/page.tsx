import { createServerSupabase } from '@/lib/supabase-server'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { notFound, redirect } from 'next/navigation'
import type { Project } from '@/lib/types'
import { PROJECT_ROUTE_SECTIONS, type ProjectRouteSection } from '@/lib/project-routes'
import { getGuidedTutorial } from '@/lib/guided-tutorials'
import { ProjectTabs, type ProjectTab } from '../project-tabs'

export const dynamic = 'force-dynamic'

export default async function ProjectSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; section: string }>
  searchParams: Promise<{ view?: string; guidedTour?: string; tourStep?: string }>
}) {
  const [{ id, section }, { view, guidedTour, tourStep }] = await Promise.all([params, searchParams])
  if (!PROJECT_ROUTE_SECTIONS.includes(section as ProjectRouteSection)) notFound()

  const recoverTour = () => {
    const tutorial = getGuidedTutorial(guidedTour)
    const tutorialId = tutorial?.id || 'navigation'
    const safeStep = /^\d+$/.test(tourStep || '') ? tourStep : id === 'new' ? '3' : '0'
    redirect(`/dashboard?guidedTour=${tutorialId}&tourStep=${safeStep}&tourRecovered=missing-project`)
  }

  // `new` is a route keyword, never a project id. Older tour builds could
  // accidentally navigate here, so recover them instead of rendering a 404.
  if (id === 'new') recoverTour()

  const supabase = await createServerSupabase()
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) {
    if (getGuidedTutorial(guidedTour)) recoverTour()
    notFound()
  }

  const initialTab: ProjectTab = section === 'feedback-form'
    ? 'customize'
    : section === 'release-notes'
      ? 'updates'
      : section === 'install' && view === 'customize'
        ? 'customize'
        : section as ProjectTab
  const billingSummary = await getCurrentUserBillingSummary()
  return <ProjectTabs project={project as Project} billingSummary={billingSummary} initialTab={initialTab} />
}
