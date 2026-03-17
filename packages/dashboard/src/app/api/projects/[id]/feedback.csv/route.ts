import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthedUserAndProject(id)
  if ('error' in result) return result.error

  const { admin } = result

  const { data, error } = await admin
    .from('feedback')
    .select('created_at, message, email, type, rating, priority, status, url, tags')
    .eq('project_id', id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

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
          const str = String(val)
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
