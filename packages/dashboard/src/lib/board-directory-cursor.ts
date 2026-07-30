export type BoardDirectoryCursor = {
  score: number
  activityAt: string
  id: string
  snapshotAt: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function encodeBoardDirectoryCursor(cursor: BoardDirectoryCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeBoardDirectoryCursor(value?: string | null): BoardDirectoryCursor | null {
  if (!value || value.length > 1024) return null
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<BoardDirectoryCursor>
    if (
      typeof cursor.score !== 'number'
      || !Number.isFinite(cursor.score)
      || typeof cursor.activityAt !== 'string'
      || !Number.isFinite(Date.parse(cursor.activityAt))
      || typeof cursor.snapshotAt !== 'string'
      || !Number.isFinite(Date.parse(cursor.snapshotAt))
      || typeof cursor.id !== 'string'
      || !UUID.test(cursor.id)
    ) return null
    return {
      score: cursor.score,
      activityAt: new Date(cursor.activityAt).toISOString(),
      snapshotAt: new Date(cursor.snapshotAt).toISOString(),
      id: cursor.id,
    }
  } catch {
    return null
  }
}
