import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import {
  boardBrandingToColumns,
  normalizeBoardAnnouncementId,
  parseBoardBranding,
  sanitizeBoardAnnouncements,
  sanitizeBoardBranding,
  serializeBoardBranding,
} from '@/lib/public-board'

type RouteParams = { params: Promise<{ id: string }> }

const ALLOWED_TYPES = new Set(['idea', 'bug', 'praise', 'question'])
const TYPED_BOARD_COLUMN_ERROR = /could not find the '.*' column of 'public_board_settings' in the schema cache/i

async function getAuthedProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('id, name, owner_user_id')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) {
    return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  }

  return { admin, project, user }
}

function sanitizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function sanitizeSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return slug ? slug.slice(0, 80) : null
}

function sanitizeShowTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return ['idea', 'bug']
  const next = value
    .filter((entry): entry is string => typeof entry === 'string' && ALLOWED_TYPES.has(entry))
    .slice(0, 4)

  return next.length > 0 ? [...new Set(next)] : ['idea', 'bug']
}

function normalizeAnnouncementPublishedAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }
  return parsed.toISOString()
}

async function loadBoardSettings(projectId: string) {
  const admin = await createAdminSupabase()
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (!board) {
    return {
      board: null,
      announcements: [],
      reports: [],
      stats: {
        followerCount: 0,
        watchCount: 0,
        openReportCount: 0,
      },
    }
  }

  const [announcementsResult, reportsResult, followCountResult, watchCountResult] = await Promise.all([
    admin
      .from('board_announcements')
      .select('id, title, body, href, published_at, sort_order')
      .eq('board_id', board.id)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false }),
    admin
      .from('board_reports')
      .select('id, board_id, project_id, feedback_id, user_id, reporter_email, target_type, reason, details, status, created_at, updated_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('board_follows')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', board.id),
    admin
      .from('feedback_watches')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', board.id),
  ])

  const announcements = (announcementsResult.data || []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    publishedAt: announcement.published_at,
    ...(announcement.href ? { href: announcement.href } : {}),
  }))

  const reports = reportsResult.data || []
  const openReportCount = reports.filter((report) => report.status === 'open').length

  return {
    board: {
      ...board,
      profile: parseBoardBranding(board),
      announcements,
    },
    announcements,
    reports,
    stats: {
      followerCount: followCountResult.count || 0,
      watchCount: watchCountResult.count || 0,
      openReportCount,
    },
  }
}

function buildBoardSettingsPayload(
  projectId: string,
  body: Record<string, unknown>,
  slug: string,
  showTypes: string[],
  customCss: string | null,
  profile: ReturnType<typeof sanitizeBoardBranding>,
  announcements: ReturnType<typeof sanitizeBoardAnnouncements>,
) {
  return {
    project_id: projectId,
    enabled: body.enabled === true,
    slug,
    title: sanitizeText(body.title, 120),
    description: sanitizeText(body.description, 280),
    show_types: showTypes,
    allow_submissions: body.allow_submissions !== false,
    require_email_to_vote: body.require_email_to_vote === true,
    custom_css: customCss,
    branding: serializeBoardBranding({ ...profile, announcements }),
    updated_at: new Date().toISOString(),
  }
}

function isTypedBoardColumnError(message: string | undefined) {
  return Boolean(message && TYPED_BOARD_COLUMN_ERROR.test(message))
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('project' in result)) return result.error

    const payload = await loadBoardSettings(id)
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedProject(id)
    if ('error' in result && !('project' in result)) return result.error
    const { admin, user } = result as Exclude<typeof result, { error: NextResponse }>

    const body = await request.json()
    const slug = sanitizeSlug(body.slug)
    if (!slug) {
      return NextResponse.json({ error: 'A board slug is required' }, { status: 400 })
    }

    const customCss = typeof body.custom_css === 'string'
      ? body.custom_css.trim().slice(0, 6000) || null
      : null
    const showTypes = sanitizeShowTypes(body.show_types)
    const profile = sanitizeBoardBranding(body.branding)
    const announcements = sanitizeBoardAnnouncements(body.announcements)
    const existing = await admin
      .from('public_board_settings')
      .select('id')
      .eq('project_id', id)
      .maybeSingle()

    const payload = buildBoardSettingsPayload(
      id,
      body as Record<string, unknown>,
      slug,
      showTypes,
      customCss,
      profile,
      announcements,
    )
    const typedPayload = {
      ...payload,
      ...boardBrandingToColumns(profile),
    }

    let boardId = existing.data?.id as string | undefined

    if (boardId) {
      const { error } = await admin
        .from('public_board_settings')
        .update(typedPayload)
        .eq('id', boardId)

      if (error) {
        if (!isTypedBoardColumnError(error.message)) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const { error: legacyError } = await admin
          .from('public_board_settings')
          .update(payload)
          .eq('id', boardId)

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message }, { status: 500 })
        }
      }
    } else {
      const { data, error } = await admin
        .from('public_board_settings')
        .insert(typedPayload)
        .select('id')
        .single()

      if (error || !data) {
        if (!isTypedBoardColumnError(error?.message)) {
          return NextResponse.json({ error: error?.message || 'Failed to create board settings' }, { status: 500 })
        }

        const legacyInsert = await admin
          .from('public_board_settings')
          .insert(payload)
          .select('id')
          .single()

        if (legacyInsert.error || !legacyInsert.data) {
          return NextResponse.json({ error: legacyInsert.error?.message || 'Failed to create board settings' }, { status: 500 })
        }

        boardId = legacyInsert.data.id
      } else {
        boardId = data.id
      }
    }

    await admin.from('board_announcements').delete().eq('board_id', boardId)

    if (announcements.length > 0) {
      const { error } = await admin.from('board_announcements').insert(
        announcements.map((announcement, index) => ({
          id: normalizeBoardAnnouncementId(announcement.id) || crypto.randomUUID(),
          board_id: boardId,
          project_id: id,
          title: announcement.title,
          body: announcement.body,
          href: announcement.href || null,
          sort_order: index,
          published_at: normalizeAnnouncementPublishedAt(announcement.publishedAt),
          created_by: user.id,
        })),
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json(await loadBoardSettings(id))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
