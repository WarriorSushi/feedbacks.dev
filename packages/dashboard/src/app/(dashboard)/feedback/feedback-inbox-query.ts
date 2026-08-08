import type { SupabaseClient } from '@supabase/supabase-js'
import { getHistoryWindowStart } from '@feedbacks/shared'
import type { BillingSummary, Feedback, FeedbackPriority } from '@/lib/types'
import { parseFeedbackReadStateFilter } from '@/lib/feedback-read-state'
import { getSelectedProject } from '@/lib/project-selection'

export const FEEDBACK_INBOX_PAGE_SIZE = 20

const priorities: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']
const sorts = ['newest', 'oldest', 'recently_updated'] as const

export interface FeedbackInboxSearchParams {
  get(name: string): string | null
}

export interface FeedbackInboxFilters {
  page: number
  status: string
  type: string
  search: string
  agent: string
  publicOnly: boolean
  priority: FeedbackPriority | ''
  requestedProjectId: string | null
  showingAllProjects: boolean
  tag: string
  read: 'all' | 'unread'
  sort: (typeof sorts)[number]
}

export interface FeedbackInboxProject {
  id: string
  name: string
  settings?: { icon?: string } | null
}

export function parseFeedbackInboxFilters(searchParams: FeedbackInboxSearchParams): FeedbackInboxFilters {
  const requestedPage = Number(searchParams.get('page') || '1')
  const requestedPriority = searchParams.get('priority') as FeedbackPriority
  const requestedSort = searchParams.get('sort') || ''
  const requestedProjectId = searchParams.get('projectId')

  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('q') || '',
    agent: searchParams.get('agent') || '',
    publicOnly: searchParams.get('public') === '1',
    priority: priorities.includes(requestedPriority) ? requestedPriority : '',
    requestedProjectId,
    showingAllProjects: requestedProjectId === 'all',
    tag: searchParams.get('tag') || '',
    read: parseFeedbackReadStateFilter(searchParams.get('read')),
    sort: sorts.includes(requestedSort as (typeof sorts)[number])
      ? (requestedSort as (typeof sorts)[number])
      : 'newest',
  }
}

export function resolveFeedbackInboxProject(
  filters: FeedbackInboxFilters,
  projects: FeedbackInboxProject[],
  storedProjectId?: string,
) {
  const defaultProjectId = getSelectedProject(projects, storedProjectId)?.id || ''
  const projectId = filters.showingAllProjects
    ? ''
    : filters.requestedProjectId || defaultProjectId

  return { defaultProjectId, projectId }
}

export function getEarlyFeedbackProjectCandidate(
  filters: FeedbackInboxFilters,
  storedProjectId?: string,
) {
  if (filters.showingAllProjects) return { canLoadEarly: true, projectId: '' }
  if (filters.requestedProjectId) {
    return { canLoadEarly: true, projectId: filters.requestedProjectId }
  }
  if (storedProjectId) return { canLoadEarly: true, projectId: storedProjectId }
  return { canLoadEarly: false, projectId: '' }
}

export function getFeedbackHistoryCutoff(billingSummary: BillingSummary | null): string | null {
  return billingSummary ? getHistoryWindowStart(billingSummary.entitlements) : null
}

export function getFeedbackInboxQueryKey(
  filters: FeedbackInboxFilters,
  projectId: string,
  historyCutoff: string | null,
) {
  return JSON.stringify({
    page: filters.page,
    status: filters.status,
    type: filters.type,
    search: filters.search,
    agent: filters.agent,
    publicOnly: filters.publicOnly,
    priority: filters.priority,
    projectId,
    tag: filters.tag,
    read: filters.read,
    sort: filters.sort,
    historyCutoff,
  })
}

export async function queryFeedbackInbox(
  supabase: SupabaseClient,
  filters: FeedbackInboxFilters,
  projectId: string,
  historyCutoff: string | null,
  signal?: AbortSignal,
) {
  let query = supabase
    .from('feedback')
    .select('*, projects(id, name)', { count: 'exact' })
    .eq('is_archived', false)
    .range(
      (filters.page - 1) * FEEDBACK_INBOX_PAGE_SIZE,
      filters.page * FEEDBACK_INBOX_PAGE_SIZE - 1,
    )

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.search) query = query.ilike('message', `%${filters.search}%`)
  if (filters.agent) query = query.not('agent_name', 'is', null)
  if (filters.publicOnly) query = query.eq('is_public', true)
  if (filters.priority === 'high') query = query.in('priority', ['high', 'critical'])
  else if (filters.priority) query = query.eq('priority', filters.priority)
  if (projectId) query = query.eq('project_id', projectId)
  if (filters.tag) query = query.contains('tags', [filters.tag])
  if (filters.read === 'unread') query = query.is('read_at', null)
  if (historyCutoff) query = query.gte('created_at', historyCutoff)
  if (filters.sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (filters.sort === 'recently_updated') query = query.order('updated_at', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  if (signal) query = query.abortSignal(signal)

  const { data, count, error } = await query
  return {
    feedbacks: (data as Feedback[] | null) || [],
    total: count || 0,
    error,
  }
}
