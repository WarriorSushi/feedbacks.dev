import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/workspace-shell'

export function ProjectRequiredEmpty({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon={FolderOpen}
        title="Create a project first"
        description="Project settings, feedback, integrations, API access, and product updates stay together in one workspace."
        action={(
          <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Create project
          </Link>
          </Button>
        )}
        detail="You only need a project name to begin. Install and customization come next."
      />
    </div>
  )
}
