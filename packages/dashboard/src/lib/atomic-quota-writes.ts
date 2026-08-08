import { PLAN_MATRIX } from '@feedbacks/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { Project } from '@/lib/types'

type AdminClient = SupabaseClient<Database>

export type AtomicProjectWriteResult =
  | { status: 'created' | 'replayed'; project: Project; projectCount?: number; effectivePro?: boolean }
  | { status: 'quota_reached'; projectCount: number; projectLimit: number }

export type AtomicFeedbackWriteResult =
  | { status: 'created'; feedbackId: string; feedbackCount: number; feedbackLimit: number | null; effectivePro: boolean }
  | { status: 'replayed'; feedbackId: string }
  | { status: 'quota_reached'; feedbackCount: number; feedbackLimit: number }
  | { status: 'project_frozen' | 'project_not_found' | 'id_conflict' }

function objectData(value: Json | null): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Atomic quota RPC returned an invalid response')
  }
  return value
}

function requiredString(value: Json | undefined, field: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Atomic quota RPC response is missing ${field}`)
  }
  return value
}

function numericValue(value: Json | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export async function createProjectWithAtomicQuota({
  admin,
  project,
  bypassQuota,
}: {
  admin: AdminClient
  project: Record<string, unknown>
  bypassQuota: boolean
}): Promise<AtomicProjectWriteResult> {
  const { data, error } = await admin.rpc('create_project_with_quota', {
    p_project: project as Json,
    p_bypass_quota: bypassQuota,
    p_free_project_limit: PLAN_MATRIX.free.projectLimit ?? 2,
  })
  if (error) throw error

  const result = objectData(data)
  const status = requiredString(result.status, 'status')
  if (status === 'quota_reached') {
    return {
      status,
      projectCount: numericValue(result.project_count),
      projectLimit: numericValue(result.project_limit, PLAN_MATRIX.free.projectLimit ?? 2),
    }
  }
  if (status !== 'created' && status !== 'replayed') {
    throw new Error(`Atomic project write returned unexpected status: ${status}`)
  }
  const projectData = objectData((result.project ?? null) as Json | null)
  requiredString(projectData.id, 'project.id')
  return {
    status,
    project: projectData as unknown as Project,
    projectCount: numericValue(result.project_count),
    effectivePro: result.effective_pro === true,
  }
}

export async function insertFeedbackWithAtomicQuota({
  admin,
  feedback,
  media = [],
  bypassQuota,
  bypassPlanFreeze = false,
  allowReplay = false,
  recordFirstFeedback = false,
}: {
  admin: AdminClient
  feedback: Record<string, unknown>
  media?: Array<Record<string, unknown>>
  bypassQuota: boolean
  bypassPlanFreeze?: boolean
  allowReplay?: boolean
  recordFirstFeedback?: boolean
}): Promise<AtomicFeedbackWriteResult> {
  const { data, error } = await admin.rpc('insert_feedback_with_quota', {
    p_feedback: feedback as Json,
    p_media: media as Json,
    p_bypass_quota: bypassQuota,
    p_bypass_plan_freeze: bypassPlanFreeze,
    p_allow_replay: allowReplay,
    p_record_first_feedback: recordFirstFeedback,
    p_free_feedback_limit: PLAN_MATRIX.free.feedbackMonthlyLimit ?? 500,
  })
  if (error) throw error

  const result = objectData(data)
  const status = requiredString(result.status, 'status')
  if (status === 'created') {
    return {
      status,
      feedbackId: requiredString(result.feedback_id, 'feedback_id'),
      feedbackCount: numericValue(result.feedback_count),
      feedbackLimit: typeof result.feedback_limit === 'number' ? result.feedback_limit : null,
      effectivePro: result.effective_pro === true,
    }
  }
  if (status === 'replayed') {
    return { status, feedbackId: requiredString(result.feedback_id, 'feedback_id') }
  }
  if (status === 'quota_reached') {
    return {
      status,
      feedbackCount: numericValue(result.feedback_count),
      feedbackLimit: numericValue(result.feedback_limit, PLAN_MATRIX.free.feedbackMonthlyLimit ?? 500),
    }
  }
  if (status === 'project_frozen' || status === 'project_not_found' || status === 'id_conflict') {
    return { status }
  }
  throw new Error(`Atomic feedback write returned unexpected status: ${status}`)
}
