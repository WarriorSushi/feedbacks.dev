const DEFAULT_JSON_BODY_LIMIT = 64 * 1024

function errorResponse(request: Request, code: string, message: string, status: number) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  return Response.json(
    { code, message, error: message, requestId },
    { status, headers: { 'x-request-id': requestId } },
  )
}

export async function readJsonBody<T extends Record<string, unknown> = Record<string, unknown>>(
  request: Request,
  options: { maxBytes?: number; allowEmpty?: boolean } = {},
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() || ''
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      response: errorResponse(request, 'unsupported_media_type', 'Content-Type must be application/json.', 415),
    }
  }

  const maxBytes = options.maxBytes || DEFAULT_JSON_BODY_LIMIT
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      response: errorResponse(request, 'request_too_large', `JSON body must be ${maxBytes} bytes or fewer.`, 413),
    }
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return {
      ok: false,
      response: errorResponse(request, 'request_too_large', `JSON body must be ${maxBytes} bytes or fewer.`, 413),
    }
  }
  if (!text.trim()) {
    if (options.allowEmpty) return { ok: true, data: {} as T }
    return {
      ok: false,
      response: errorResponse(request, 'invalid_json', 'A JSON request body is required.', 400),
    }
  }

  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        response: errorResponse(request, 'invalid_json', 'JSON body must be an object.', 400),
      }
    }
    return { ok: true, data: parsed as T }
  } catch {
    return {
      ok: false,
      response: errorResponse(request, 'invalid_json', 'Request body contains invalid JSON.', 400),
    }
  }
}
