'use client'

import type { Project } from '@/lib/types'
import { BoardSettingsTabs } from '@/components/board-settings/BoardSettingsTabs'

export function BoardSettingsTab({ project }: { project: Project }) {
  return <BoardSettingsTabs project={project} />
}
