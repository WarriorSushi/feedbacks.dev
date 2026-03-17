import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single()

  if (!project) return new NextResponse('Not found', { status: 404 })

  const { data, error } = await supabase
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
