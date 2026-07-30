const COOKIE_NAME = 'feedbacks_voter'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(value: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

function readCookie(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  for (const item of cookie.split(';')) {
    const [name, ...parts] = item.trim().split('=')
    if (name === COOKIE_NAME) return parts.join('=')
  }
  return null
}

export async function getOrCreateVoterDevice(request: Request, secret: string) {
  const encoded = readCookie(request)
  if (encoded) {
    const [version, id, signature] = encoded.split('.')
    if (version === 'v1' && UUID_RE.test(id || '') && signature) {
      const expected = await hmac(`v1.${id}`, secret)
      if (constantTimeEqual(signature, expected)) {
        return { id, cookieValue: encoded, isNew: false }
      }
    }
  }

  const id = crypto.randomUUID()
  const signature = await hmac(`v1.${id}`, secret)
  return { id, cookieValue: `v1.${id}.${signature}`, isNew: true }
}

export async function getVoterIdentifier(deviceId: string, boardSlug: string, secret: string) {
  return hmac(`vote:${boardSlug}:${deviceId}`, secret)
}

export const VOTER_COOKIE = {
  name: COOKIE_NAME,
  maxAge: 60 * 60 * 24 * 365,
} as const
