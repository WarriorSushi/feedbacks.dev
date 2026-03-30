import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env.ts'

const API_BASES = {
  test: 'https://test.dodopayments.com',
  live: 'https://live.dodopayments.com',
} as const

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

async function dodoRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
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
  return dodoRequest<{
    link?: string
    portal_url?: string
    session_id?: string
  }>(`/customers/${payload.customerId}/customer-portal/session`, {})
}

function headerValue(headers: Headers, key: string) {
  return headers.get(key) || headers.get(key.toLowerCase())
}

export async function verifyDodoWebhook(request: Request) {
  if (!env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    throw new Error('Dodo webhook secret is not configured')
  }

  const payload = await request.text()
  const signature = headerValue(request.headers, 'webhook-signature')
  const webhookId = headerValue(request.headers, 'webhook-id')
  const timestamp = headerValue(request.headers, 'webhook-timestamp')

  if (!signature || !webhookId || !timestamp) {
    throw new Error('Missing Dodo webhook headers')
  }

  const signedContent = `${webhookId}.${timestamp}.${payload}`
  const expected = createHmac('sha256', env.DODO_PAYMENTS_WEBHOOK_SECRET)
    .update(signedContent)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error('Invalid webhook signature')
  }

  return {
    webhookId,
    payload,
    event: JSON.parse(payload) as DodoEventPayload,
  }
}
