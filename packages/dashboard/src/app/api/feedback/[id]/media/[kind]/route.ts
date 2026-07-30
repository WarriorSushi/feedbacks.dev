import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'

type RouteParams = { params: Promise<{ id: string; kind: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: feedbackId, kind } = await params
  if (kind !== 'screenshot' && kind !== 'attachment') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminSupabase()
  const { data: feedback } = await admin
    .from('feedback')
    .select('id, project_id')
    .eq('id', feedbackId)
    .maybeSingle()
  if (!feedback) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', feedback.project_id)
    .eq('owner_user_id', user.id)
    .maybeSingle()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let mediaQuery = admin
    .from('feedback_media')
    .select('id, bucket, storage_path, safe_filename, mime_type, size_bytes, scan_status')
    .eq('feedback_id', feedbackId)
    .eq('project_id', project.id)
    .eq('kind', kind)
    .eq('scan_status', 'clean')
    .is('deleted_at', null)

  if (kind === 'attachment') {
    const mediaId = request.nextUrl.searchParams.get('mediaId')
    if (!mediaId || !/^[0-9a-f-]{36}$/i.test(mediaId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    mediaQuery = mediaQuery.eq('id', mediaId)
  }

  const { data: media } = await mediaQuery.limit(1).maybeSingle()
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: file, error } = await admin.storage.from(media.bucket).download(media.storage_path)
  if (error || !file) return NextResponse.json({ error: 'Media unavailable' }, { status: 404 })

  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length !== media.size_bytes) {
    return NextResponse.json({ error: 'Media integrity check failed' }, { status: 409 })
  }

  const disposition = kind === 'screenshot' ? 'inline' : 'attachment'
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': media.mime_type,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `${disposition}; filename="${media.safe_filename}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
