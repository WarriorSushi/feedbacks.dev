type FeedbackCursor = {
  createdAt: string
  id: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function encodeFeedbackCursor(value: FeedbackCursor): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

export function decodeFeedbackCursor(value: string | null): FeedbackCursor | null {
  if (!value || value.length > 512) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<FeedbackCursor>
    if (
      typeof parsed.createdAt !== 'string'
      || !Number.isFinite(Date.parse(parsed.createdAt))
      || typeof parsed.id !== 'string'
      || !UUID.test(parsed.id)
    ) return null
    return { createdAt: new Date(parsed.createdAt).toISOString(), id: parsed.id }
  } catch {
    return null
  }
}

export function feedbackCursorFilter(cursor: FeedbackCursor): string {
  return `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${cursor.id})`
}

export function nextFeedbackCursor(
  rows: Array<{ created_at: string; id: string }>,
  hasMore: boolean,
): string | null {
  if (!hasMore || rows.length === 0) return null
  const last = rows.at(-1)
  return last ? encodeFeedbackCursor({ createdAt: last.created_at, id: last.id }) : null
}
