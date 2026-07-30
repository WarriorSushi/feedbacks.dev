import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    const text = await request.text()
    if (new TextEncoder().encode(text).byteLength > MAX_CSP_REPORT_BYTES) {
      console.warn('[security] CSP report rejected', { reason: 'too_large' })
      return new NextResponse(null, { status: 204 })
    }
    const parsed = JSON.parse(text) as Record<string, unknown>
    const report = (parsed['csp-report'] || parsed.body || parsed) as Record<string, unknown>
    console.warn('[security] CSP report-only violation', {
      documentOrigin: safeOrigin(report['document-uri'] || report.documentURL),
      blockedOrigin: safeOrigin(report['blocked-uri'] || report.blockedURL),
      effectiveDirective: report['effective-directive'] || report.effectiveDirective || null,
      disposition: report.disposition || 'report',
      statusCode: report['status-code'] || report.statusCode || null,
    })
  } catch {
    console.warn('[security] Failed to parse CSP report', { reason: 'invalid_payload' })
  }

  return new NextResponse(null, { status: 204 })
}
