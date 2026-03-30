import type { Page } from '@playwright/test'
import { uniqueSuffix } from './seed'

export interface SeededProject {
  id: string
  apiKey: string
  name: string
  domain: string | null
}

export async function createProjectViaApi(
  page: Page,
  input: {
    name?: string
    domain?: string | null
  } = {},
): Promise<SeededProject> {
  const name = input.name || uniqueSuffix('Playwright Project')
  const response = await page.request.post('/api/projects', {
    data: {
      name,
      domain: input.domain ?? null,
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to create project: ${response.status()} ${JSON.stringify(payload)}`)
  }

  const storageKey = `feedbacks:project-api-key:${payload.id}`
  await page.evaluate(
    ({ nextStorageKey, nextApiKey }: { nextStorageKey: string; nextApiKey: string }) => {
      window.sessionStorage.setItem(nextStorageKey, nextApiKey)
    },
    { nextStorageKey: storageKey, nextApiKey: payload.api_key },
  )

  return {
    id: payload.id,
    apiKey: payload.api_key,
    name: payload.name,
    domain: payload.domain || null,
  }
}

export function projectInstallPath(projectId: string): string {
  return `/projects/${projectId}?tab=install`
}

export function projectCustomizePath(projectId: string): string {
  return `/projects/${projectId}?tab=customize`
}

export function projectVerifyPath(projectId: string): string {
  return `/projects/${projectId}/verify`
}
