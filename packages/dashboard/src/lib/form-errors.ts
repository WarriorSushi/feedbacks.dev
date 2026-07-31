export type FieldErrors = Record<string, string>

export type ErrorPayload = {
  error?: unknown
  code?: unknown
  fieldErrors?: Record<string, unknown>
}

export function readFieldErrors(payload: ErrorPayload | null | undefined): FieldErrors {
  if (!payload?.fieldErrors || typeof payload.fieldErrors !== 'object') return {}

  return Object.fromEntries(
    Object.entries(payload.fieldErrors).flatMap(([field, value]) => {
      const message = Array.isArray(value) ? value.find((entry) => typeof entry === 'string') : value
      return typeof message === 'string' && message.trim() ? [[field, message.trim()]] : []
    }),
  )
}

export function readErrorMessage(payload: ErrorPayload | null | undefined, fallback: string): string {
  return typeof payload?.error === 'string' && payload.error.trim() ? payload.error.trim() : fallback
}
