import { NextRequest, NextResponse } from 'next/server'
import { readRequestBodyWithLimit, RequestBodyTooLargeError } from '@/lib/request-body-limit'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_CSP_REPORT_BYTES = 32 * 1024

function safeOrigin(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  if (value === 'inline' || value === 'eval') return value
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : url.protocol
  } catch {
    return 'redacted'
  }
}

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, 'csp-report', 30, 10)
  if (!rate.allowed) return new NextResponse(null, { status: 204 })

  try {
    const text = new TextDecoder().decode(
      await readRequestBodyWithLimit(request, MAX_CSP_REPORT_BYTES),
    )
    const parsed = JSON.parse(text) as Record<string, unknown>
    const report = (parsed['csp-report'] || parsed.body || parsed) as Record<string, unknown>
    console.warn('[security] CSP report-only violation', {
      documentOrigin: safeOrigin(report['document-uri'] || report.documentURL),
      blockedOrigin: safeOrigin(report['blocked-uri'] || report.blockedURL),
      effectiveDirective: report['effective-directive'] || report.effectiveDirective || null,
      disposition: report.disposition || 'report',
      statusCode: report['status-code'] || report.statusCode || null,
    })
  } catch (error) {
    console.warn('[security] Failed to parse CSP report', {
      reason: error instanceof RequestBodyTooLargeError ? 'too_large' : 'invalid_payload',
    })
  }

  return new NextResponse(null, { status: 204 })
}
