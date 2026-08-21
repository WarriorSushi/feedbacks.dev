export const BETA_STAGE_OPTIONS = [
  { value: 'prelaunch', label: 'Pre-launch or private prototype' },
  { value: 'early-live', label: 'Live, fewer than 100 users' },
  { value: 'growing', label: 'Live, 100 to 1,000 users' },
  { value: 'established', label: 'Live, more than 1,000 users' },
] as const

export const BETA_TIMELINE_OPTIONS = [
  { value: 'this-week', label: 'I can install it this week' },
  { value: 'this-month', label: 'I can install it this month' },
  { value: 'exploring', label: 'I am still exploring' },
] as const

export type BetaStage = (typeof BETA_STAGE_OPTIONS)[number]['value']
export type BetaTimeline = (typeof BETA_TIMELINE_OPTIONS)[number]['value']
export type BetaApplicationField = 'email' | 'useCase' | 'applicationStage' | 'installTimeline' | 'currentTool' | 'newsletterConsent'
export type BetaApplicationFieldErrors = Partial<Record<BetaApplicationField, string[]>>

const stageValues = new Set<string>(BETA_STAGE_OPTIONS.map((option) => option.value))
const timelineValues = new Set<string>(BETA_TIMELINE_OPTIONS.map((option) => option.value))

export function validateBetaApplication(input: {
  useCase?: unknown
  applicationStage?: unknown
  installTimeline?: unknown
  currentTool?: unknown
}):
  | { ok: true; value: { useCase: string; applicationStage: BetaStage; installTimeline: BetaTimeline; currentTool: string | null } }
  | { ok: false; fieldErrors: BetaApplicationFieldErrors } {
  const useCase = typeof input.useCase === 'string' ? input.useCase.trim() : ''
  const applicationStage = typeof input.applicationStage === 'string' ? input.applicationStage : ''
  const installTimeline = typeof input.installTimeline === 'string' ? input.installTimeline : ''
  const currentTool = typeof input.currentTool === 'string' ? input.currentTool.trim() : ''
  const fieldErrors: BetaApplicationFieldErrors = {}

  if (useCase.length < 20 || useCase.length > 500) {
    fieldErrors.useCase = ['Describe the product and the feedback problem in 20 to 500 characters.']
  }
  if (!stageValues.has(applicationStage)) {
    fieldErrors.applicationStage = ['Choose the stage that best matches your product.']
  }
  if (!timelineValues.has(installTimeline)) {
    fieldErrors.installTimeline = ['Choose when you could realistically install the widget.']
  }
  if (currentTool.length > 120) {
    fieldErrors.currentTool = ['Keep the current-tool answer under 120 characters.']
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }
  return {
    ok: true,
    value: {
      useCase,
      applicationStage: applicationStage as BetaStage,
      installTimeline: installTimeline as BetaTimeline,
      currentTool: currentTool || null,
    },
  }
}
