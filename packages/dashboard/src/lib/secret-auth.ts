import { timingSafeEqual } from 'node:crypto'

export function verifyBearerSecret(authorization: string | null, secret: string | null | undefined): boolean {
  if (!secret || !authorization?.startsWith('Bearer ')) return false

  const provided = Buffer.from(authorization.slice('Bearer '.length), 'utf8')
  const expected = Buffer.from(secret, 'utf8')
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}
