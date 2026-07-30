const STATUS_CODES: Record<number, string> = {
  400: 'invalid_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'request_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limited',
  500: 'internal_error',
  503: 'service_unavailable',
}

export function apiV1Error(message: string, status: number, headers: Record<string, string> = {}) {
  const requestId = crypto.randomUUID()
  return Response.json(
    {
      code: STATUS_CODES[status] || 'request_failed',
      message,
      // Kept during the v1 compatibility window for existing clients.
      error: message,
      requestId,
    },
    { status, headers: { ...headers, 'x-request-id': requestId } },
  )
}
