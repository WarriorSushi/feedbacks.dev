import { Layers3 } from 'lucide-react'
import { DEFAULT_PROJECT_ICON } from '@/lib/project-icons'
import { ProjectScopeButton } from './feedback-ui'

interface ProjectScopeOption {
  id: string
  name: string
  settings?: { icon?: string } | null
}

export function FeedbackProjectScope({
  projects,
  selectedProjectId,
  showingAllProjects,
  onSelect,
}: {
  projects: ProjectScopeOption[]
  selectedProjectId: string
  showingAllProjects: boolean
  onSelect: (projectId: string) => void
}) {
  if (projects.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Project view</p>
        <p className="text-[11px] text-muted-foreground">Choose one project or include the whole workspace.</p>
      </div>
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="scroll-fade-x flex snap-x items-center gap-2 overflow-x-auto pb-1 pr-8 scrollbar-thin md:pr-0">
          <ProjectScopeButton
            active={showingAllProjects}
            onClick={() => onSelect('all')}
            icon={<Layers3 className="h-3.5 w-3.5" />}
          >
            All projects
          </ProjectScopeButton>
          {projects.map((project) => (
            <ProjectScopeButton
              key={project.id}
              active={selectedProjectId === project.id}
              onClick={() => onSelect(project.id)}
              icon={<span aria-hidden="true" className="text-sm leading-none">{project.settings?.icon || DEFAULT_PROJECT_ICON}</span>}
            >
              {project.name}
            </ProjectScopeButton>
          ))}
        </div>
      </div>
    </div>
  )
}
