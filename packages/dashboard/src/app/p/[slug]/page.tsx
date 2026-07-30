import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadBoardDirectoryEntries, recommendBoards } from '@/lib/board-discovery'
import { isBoardPubliclyAccessible, parseBoardBranding } from '@/lib/public-board'
import { PublicBoard } from './public-board'
import { sanitizeCustomBoardCss } from '@/lib/board-custom-css'
import { SITE_ORIGIN } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ page?: string }>
}

const PUBLIC_FEEDBACK_PAGE_SIZE = 30

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const admin = await createAdminSupabase()
  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return {
      title: 'Board not found',
      description: 'This board is not publicly available.',
    }
  }

  const branding = parseBoardBranding(board)

  const title = branding.heroTitle || board?.title || 'Feature Board'
  const description = branding.heroDescription || board?.description || 'Vote on requests, add context, and follow the public layer of the team feedback workflow.'
  return {
    title,
    description,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_ORIGIN}/p/${slug}`,
      title,
      description,
      siteName: 'feedbacks.dev',
    },
  }
}

export default async function PublicBoardPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const query = await searchParams
  const requestedPage = Math.max(1, Math.min(1000, Number(query?.page) || 1))
  const admin = await createAdminSupabase()
  const supabase = await createServerSupabase()

  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) notFound()
  const branding = parseBoardBranding(board)

  const { data: feedback, count: feedbackCount } = await admin
    .from('feedback')
    .select('id, message, type, status, vote_count, created_at', { count: 'exact' })
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .in('type', board.show_types || ['idea', 'bug'])
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(
      (requestedPage - 1) * PUBLIC_FEEDBACK_PAGE_SIZE,
      requestedPage * PUBLIC_FEEDBACK_PAGE_SIZE - 1,
    )

  // Fetch public admin comments
  const feedbackIds = (feedback || []).map((f) => f.id)
  let comments: { id: string; feedback_id: string; content: string; created_at: string }[] = []
  if (feedbackIds.length > 0) {
    const { data: notesData } = await admin
      .from('feedback_notes')
      .select('id, feedback_id, content, created_at')
      .eq('is_public', true)
      .in('feedback_id', feedbackIds)
      .order('created_at', { ascending: true })
    comments = notesData || []
  }

  const { data: { user } } = await supabase.auth.getUser()
  let canModerate = false
  let initialFollowed = false
  let initialWatchedIds: string[] = []
  if (user) {
    const { data: project } = await admin
      .from('projects')
      .select('id')
      .eq('id', board.project_id)
      .eq('owner_user_id', user.id)
      .single()
    canModerate = Boolean(project)

    const { data: follow } = await admin
      .from('board_follows')
      .select('id')
      .eq('board_id', board.id)
      .eq('user_id', user.id)
      .maybeSingle()

    let watches: { feedback_id: string }[] = []
    if (feedbackIds.length > 0) {
      const { data } = await admin
        .from('feedback_watches')
        .select('feedback_id')
        .eq('board_id', board.id)
        .eq('user_id', user.id)
        .in('feedback_id', feedbackIds)
      watches = data || []
    }

    initialFollowed = Boolean(follow)
    initialWatchedIds = (watches || []).map((watch) => watch.feedback_id)
  }

  const { data: announcementsData } = await admin
    .from('board_announcements')
    .select('id, title, body, href, published_at, sort_order')
    .eq('board_id', board.id)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })

  const directoryEntries = await loadBoardDirectoryEntries()
  const recommendations = recommendBoards(directoryEntries, board.slug, branding.categories || [], 3)

  return (
    <PublicBoard
      board={{
        projectId: board.project_id,
        title: board.title,
        description: board.description,
        slug: board.slug,
        allow_submissions: board.allow_submissions,
        show_types: board.show_types || ['idea', 'bug'],
        branding,
        customCss: (() => {
          try {
            return sanitizeCustomBoardCss(board.custom_css)
          } catch {
            return null
          }
        })(),
        displayName: board.display_name || null,
      }}
      initialFeedback={feedback || []}
      totalFeedback={feedbackCount || 0}
      pagination={{
        currentPage: requestedPage,
        pageCount: Math.max(1, Math.ceil((feedbackCount || 0) / PUBLIC_FEEDBACK_PAGE_SIZE)),
      }}
      initialComments={comments}
      initialAnnouncements={(announcementsData || []).map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        publishedAt: announcement.published_at,
        ...(announcement.href ? { href: announcement.href } : {}),
      }))}
      canModerate={canModerate}
      viewerSignedIn={Boolean(user)}
      initialFollowed={initialFollowed}
      initialWatchedIds={initialWatchedIds}
      recommendations={recommendations}
    />
  )
}
