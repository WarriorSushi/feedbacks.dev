import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env.ts'
import { readRequestBodyWithLimit } from './request-body-limit.ts'

const API_BASES = {
  test: 'https://test.dodopayments.com',
  live: 'https://live.dodopayments.com',
} as const
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000
export const DODO_WEBHOOK_BODY_LIMIT = 256 * 1024

export interface DodoCheckoutRequest {
  productId: string
  customerEmail: string
  customerName?: string | null
  returnUrl: string
  metadata?: Record<string, string>
}

export interface DodoPortalRequest {
  customerId: string
  returnUrl: string
}

export interface DodoEventPayload {
  business_id?: string
  data?: Record<string, unknown>
  timestamp?: string
  type?: string
}

function getApiBase() {
  return API_BASES[env.DODO_PAYMENTS_ENVIRONMENT]
}

function getDodoAuthHeaders() {
  if (!env.DODO_PAYMENTS_API_KEY) {
    throw new Error('Dodo Payments is not configured')
  }

  return {
    Authorization: `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function dodoRequest<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: getDodoAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Dodo request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function createDodoCheckoutSession(payload: DodoCheckoutRequest) {
  return dodoRequest<{
    checkout_url?: string
    payment_link?: string
    customer?: { customer_id?: string }
    session_id?: string
  }>('/checkouts', {
    product_cart: [{ product_id: payload.productId, quantity: 1 }],
    customer: {
      email: payload.customerEmail,
      name: payload.customerName || undefined,
    },
    return_url: payload.returnUrl,
    metadata: payload.metadata,
  })
}

export async function createDodoCustomerPortalSession(payload: DodoPortalRequest) {
  const query = new URLSearchParams({ return_url: payload.returnUrl })
  return dodoRequest<{
    link?: string
    portal_url?: string
    session_id?: string
  }>(`/customers/${payload.customerId}/customer-portal/session?${query.toString()}`)
}

function headerValue(headers: Headers, key: string) {
  return headers.get(key) || headers.get(key.toLowerCase())
}

function parseWebhookTimestamp(timestamp: string) {
  const trimmed = timestamp.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Invalid Dodo webhook timestamp')
  }

  const numericTimestamp = Number(trimmed)
  if (!Number.isSafeInteger(numericTimestamp)) {
    throw new Error('Invalid Dodo webhook timestamp')
  }

  const timestampMs = numericTimestamp < 1_000_000_000_000
    ? numericTimestamp * 1000
    : numericTimestamp
  const deltaMs = Math.abs(Date.now() - timestampMs)

  if (deltaMs > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
    throw new Error('Dodo webhook timestamp is outside the allowed tolerance')
  }
  return timestampMs
}

function signatureMatches(signatureHeader: string, expectedDigest: Buffer) {
  const trimmed = signatureHeader.trim()

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    const signatureBuffer = Buffer.from(trimmed, 'hex')
    return signatureBuffer.length === expectedDigest.length && timingSafeEqual(signatureBuffer, expectedDigest)
  }

  const candidates = trimmed
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  return candidates.some((candidate) => {
    if (!candidate.startsWith('v1,')) return false
    const encoded = candidate.slice(3)
    const signatureBuffer = Buffer.from(encoded, 'base64')
    return signatureBuffer.length === expectedDigest.length && timingSafeEqual(signatureBuffer, expectedDigest)
  })
}

function decodeStandardWebhookSecret(secret: string) {
  if (!secret.startsWith('whsec_')) return null
  const encoded = secret.slice('whsec_'.length)
  if (!encoded) return null

  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = Buffer.from(padded, 'base64')
    return decoded.length > 0 ? decoded : null
  } catch {
    return null
  }
}

function expectedWebhookDigests(secret: string, signedContent: string) {
  const secrets: Array<string | Buffer> = [secret]
  const decodedSecret = decodeStandardWebhookSecret(secret)
  if (decodedSecret) secrets.push(decodedSecret)

  return secrets.map((candidate) =>
    createHmac('sha256', candidate)
      .update(signedContent)
      .digest(),
  )
}

export async function verifyDodoWebhook(request: Request) {
  if (!env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    throw new Error('Dodo webhook secret is not configured')
  }

  const payload = new TextDecoder().decode(
    await readRequestBodyWithLimit(request, DODO_WEBHOOK_BODY_LIMIT),
  )
  const signature = headerValue(request.headers, 'webhook-signature')
  const webhookId = headerValue(request.headers, 'webhook-id')
  const timestamp = headerValue(request.headers, 'webhook-timestamp')

  if (!signature || !webhookId || !timestamp) {
    throw new Error('Missing Dodo webhook headers')
  }

  const timestampMs = parseWebhookTimestamp(timestamp)

  const signedContent = `${webhookId}.${timestamp}.${payload}`
  const expectedDigests = expectedWebhookDigests(env.DODO_PAYMENTS_WEBHOOK_SECRET, signedContent)

  if (!expectedDigests.some((expected) => signatureMatches(signature, expected))) {
    throw new Error('Invalid webhook signature')
  }

  return {
    webhookId,
    timestamp: new Date(timestampMs).toISOString(),
    payload,
    event: JSON.parse(payload) as DodoEventPayload,
  }
}
