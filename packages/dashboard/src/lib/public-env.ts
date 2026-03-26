function normalizeOrigin(value?: string): string {
  return (value || 'https://app.feedbacks.dev').replace(/\/+$/, '')
}

export const publicEnv = {
  NEXT_PUBLIC_APP_ORIGIN: normalizeOrigin(
    process.env.NEXT_PUBLIC_APP_ORIGIN || process.env.APP_BASE_URL,
  ),
} as const
