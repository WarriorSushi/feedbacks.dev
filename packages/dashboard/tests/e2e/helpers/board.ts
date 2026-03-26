import type { Page } from '@playwright/test'
import type { SeededProject } from './project'
import { getE2EEnvironment } from './seed'

export type BoardVisibility = 'public' | 'unlisted' | 'private'

export interface BoardAnnouncement {
  id?: string
  title: string
  body: string
  publishedAt: string
  href?: string
}

export interface SeededBoard {
  id: string
  projectId: string
  slug: string
  title: string | null
  description: string | null
  url: string
  branding: {
    categories: string[]
    visibility: BoardVisibility
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function putJson(page: Page, url: string, data: unknown) {
  const env = getE2EEnvironment()
  const response = await page.request.fetch(url, {
    method: 'PUT',
    data,
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Request failed for ${url}: ${response.status()} ${JSON.stringify(payload)}`)
  }
  return payload
}

export async function saveBoardSettings(
  page: Page,
  project: SeededProject,
  input: {
    slug?: string
    title?: string
    description?: string
    categories?: string[]
    visibility?: BoardVisibility
    directoryOptIn?: boolean
    allowSubmissions?: boolean
    requireEmailToVote?: boolean
    showTypes?: string[]
    customCss?: string | null
    announcements?: BoardAnnouncement[]
    heroTitle?: string
    heroDescription?: string
    logoEmoji?: string
    accentColor?: string
  } = {},
): Promise<SeededBoard> {
  const payload = await putJson(page, `/api/projects/${project.id}/board`, {
    enabled: true,
    slug: input.slug || slugify(project.name),
    title: input.title || `${project.name} Feedback`,
    description: input.description || 'Share requests, vote on what matters, and follow product updates in one place.',
    show_types: input.showTypes || ['idea', 'bug'],
    allow_submissions: input.allowSubmissions ?? true,
    require_email_to_vote: input.requireEmailToVote ?? false,
    custom_css: input.customCss || '',
    branding: {
      visibility: input.visibility || 'public',
      directoryOptIn: input.directoryOptIn ?? true,
      categories: input.categories || [],
      heroTitle: input.heroTitle,
      heroDescription: input.heroDescription,
      logoEmoji: input.logoEmoji,
      accentColor: input.accentColor,
    },
    announcements: input.announcements || [],
  })

  return {
    id: payload.board.id,
    projectId: payload.board.project_id,
    slug: payload.board.slug,
    title: payload.board.title,
    description: payload.board.description,
    url: `/p/${payload.board.slug}`,
    branding: {
      categories: payload.board.profile?.categories || input.categories || [],
      visibility: payload.board.profile?.visibility || input.visibility || 'public',
    },
  }
}

export async function submitBoardFeedback(
  page: Page,
  project: SeededProject,
  board: SeededBoard,
  input: {
    message: string
    type?: 'idea' | 'bug' | 'praise' | 'question'
    email?: string
    hp?: string
  },
) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/submit`, {
    data: {
      apiKey: project.apiKey,
      message: input.message,
      type: input.type || 'idea',
      email: input.email || 'tester@example.com',
      hp: input.hp || '',
    },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to submit feedback: ${response.status()} ${JSON.stringify(payload)}`)
  }

  return payload as { id: string; success: true; suggestions?: unknown[] }
}

export async function submitDuplicateBoardFeedback(
  page: Page,
  project: SeededProject,
  board: SeededBoard,
  message: string,
) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/submit`, {
    data: {
      apiKey: project.apiKey,
      message,
      type: 'idea',
      email: 'tester@example.com',
      hp: '',
    },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })

  return {
    status: response.status(),
    payload: await response.json().catch(() => ({})),
  }
}

export async function reportBoard(
  page: Page,
  board: SeededBoard,
  input: {
    reason: string
    details?: string
    email?: string
    feedbackId?: string
  },
) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/report`, {
    data: {
      reason: input.reason,
      details: input.details || '',
      email: input.email || 'tester@example.com',
      ...(input.feedbackId ? { feedback_id: input.feedbackId } : {}),
    },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to save report: ${response.status()} ${JSON.stringify(payload)}`)
  }

  return payload
}

export async function addPublicReply(
  page: Page,
  board: SeededBoard,
  feedbackId: string,
  content: string,
) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/comment`, {
    data: {
      feedback_id: feedbackId,
      content,
    },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to add public reply: ${response.status()} ${JSON.stringify(payload)}`)
  }

  return payload as { success: true; comment: { id: string; content: string; created_at: string } }
}

export async function moderateFeedback(
  page: Page,
  board: SeededBoard,
  feedbackId: string,
  action: 'status' | 'hide',
  value?: string,
) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/moderate`, {
    data: {
      feedback_id: feedbackId,
      action,
      value,
    },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to moderate feedback: ${response.status()} ${JSON.stringify(payload)}`)
  }

  return payload
}

export async function followBoard(page: Page, board: SeededBoard, following = true) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/follow`, {
    data: { following },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to follow board: ${response.status()} ${JSON.stringify(payload)}`)
  }
  return payload as { following: boolean }
}

export async function watchFeedback(page: Page, board: SeededBoard, feedbackId: string, watching = true) {
  const env = getE2EEnvironment()
  const response = await page.request.post(`/api/boards/${board.slug}/watch`, {
    data: { feedback_id: feedbackId, watching },
    headers: env.authBypassSecret
      ? { 'x-feedbacks-e2e-bypass': env.authBypassSecret }
      : undefined,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to watch feedback: ${response.status()} ${JSON.stringify(payload)}`)
  }
  return payload as { feedbackId: string; watching: boolean }
}

export async function seedDirectoryBoards(page: Page) {
  const firstProject = await page.request.post('/api/projects', {
    data: { name: `Playwright Directory ${Date.now().toString(36)} A`, domain: null },
  })
  const firstPayload = await firstProject.json()

  const secondProject = await page.request.post('/api/projects', {
    data: { name: `Playwright Directory ${Date.now().toString(36)} B`, domain: null },
  })
  const secondPayload = await secondProject.json()

  const firstBoard = await saveBoardSettings(page, {
    id: firstPayload.id,
    apiKey: firstPayload.api_key,
    name: firstPayload.name,
    domain: firstPayload.domain || null,
  }, {
    slug: `playwright-${Date.now().toString(36)}-analytics`,
    title: 'Analytics board',
    description: 'Public product board for analytics work.',
    categories: ['analytics', 'developer-tools'],
    heroTitle: 'Analytics board',
    heroDescription: 'A trusted, public-facing feedback board for analytics users.',
    logoEmoji: 'A',
    accentColor: '#0f766e',
  })

  const firstFeedback = await submitBoardFeedback(page, {
    id: firstPayload.id,
    apiKey: firstPayload.api_key,
    name: firstPayload.name,
    domain: firstPayload.domain || null,
  }, firstBoard, {
    message: 'Analytics charts feel too hidden in the current setup.',
    type: 'idea',
  })

  await addPublicReply(page, firstBoard, firstFeedback.id, 'Thanks. We are surfacing this in the roadmap.');
  await moderateFeedback(page, firstBoard, firstFeedback.id, 'status', 'in_progress')

  const secondBoard = await saveBoardSettings(page, {
    id: secondPayload.id,
    apiKey: secondPayload.api_key,
    name: secondPayload.name,
    domain: secondPayload.domain || null,
  }, {
    slug: `playwright-${Date.now().toString(36)}-billing`,
    title: 'Billing board',
    description: 'Public product board for billing work.',
    categories: ['billing', 'saas'],
    heroTitle: 'Billing board',
    heroDescription: 'Billing updates and feedback made public.',
    logoEmoji: 'B',
    accentColor: '#8b5cf6',
  })

  await submitBoardFeedback(page, {
    id: secondPayload.id,
    apiKey: secondPayload.api_key,
    name: secondPayload.name,
    domain: secondPayload.domain || null,
  }, secondBoard, {
    message: 'Make billing retries easier to understand.',
    type: 'bug',
  })

  return { firstBoard, secondBoard }
}
