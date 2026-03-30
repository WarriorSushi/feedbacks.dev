import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getBillingSummaryForUser, getHistoryCutoff } from '@/lib/billing'

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

  let query = admin
    .from('feedback')
    .select('created_at, message, email, type, rating, priority, status, url, tags')
    .eq('project_id', id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (historyCutoff) {
    query = query.gte('created_at', historyCutoff)
  }

  const { data, error } = await query

  if (error) return new NextResponse('Error generating CSV', { status: 500 })

  const rows = data || []
  const headers = ['created_at', 'message', 'email', 'type', 'rating', 'priority', 'status', 'url', 'tags']

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h as keyof typeof row]
          if (val == null) return ''
          if (Array.isArray(val)) return `"${val.join('; ')}"`
          let str = String(val)
          // Prevent CSV formula injection
          if (/^[=+\-@]/.test(str)) {
            str = '\t' + str
          }
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    ),
  ]

  return new NextResponse(csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="feedback-${id}.csv"`,
    },
  })
}
