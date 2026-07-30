import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getBillingSummaryForUser, getHistoryCutoff } from '@/lib/billing'
import { csvCell } from '@/lib/csv-export'

const EXPORT_PAGE_SIZE = 1_000
const headers = ['created_at', 'message', 'email', 'type', 'rating', 'priority', 'status', 'url', 'tags'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthedUserAndProject(id)
  if ('error' in result) return result.error

  const { admin, user } = result
  const summary = await getBillingSummaryForUser(user.id)
  const historyCutoff = getHistoryCutoff(summary)

  const buildQuery = (from: number, to: number) => {
    let query = admin
    .from('feedback')
    .select('created_at, message, email, type, rating, priority, status, url, tags')
    .eq('project_id', id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

    if (historyCutoff) query = query.gte('created_at', historyCutoff)
    return query
  }

  // Fetch the first page before committing response headers so database errors
  // produce a safe retryable response instead of a truncated download.
  const firstPage = await buildQuery(0, EXPORT_PAGE_SIZE - 1)
  if (firstPage.error) {
    return NextResponse.json(
      { code: 'export_unavailable', message: 'The export could not be prepared. Please try again.', error: 'The export could not be prepared. Please try again.' },
      { status: 503 },
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // UTF-8 BOM preserves Unicode when opened directly in Excel.
        controller.enqueue(encoder.encode(`\uFEFF${headers.join(',')}\r\n`))
        let rows = firstPage.data || []
        let offset = 0

        while (rows.length > 0) {
          for (const row of rows) {
            controller.enqueue(encoder.encode(`${headers.map((header) => csvCell(row[header])).join(',')}\r\n`))
          }
          if (rows.length < EXPORT_PAGE_SIZE) break

          offset += EXPORT_PAGE_SIZE
          const nextPage = await buildQuery(offset, offset + EXPORT_PAGE_SIZE - 1)
          if (nextPage.error) throw new Error('feedback_export_page_failed')
          rows = nextPage.data || []
        }
        controller.close()
      } catch {
        controller.error(new Error('The export was interrupted. Please retry.'))
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="feedback-${id}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
