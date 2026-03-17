import { createAdminSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PublicBoard } from './public-board'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const admin = await createAdminSupabase()
  const { data: board } = await admin
    .from('public_board_settings')
    .select('title, description')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  return {
    title: board?.title || 'Feature Board',
    description: board?.description || 'Vote on features and share feedback',
  }
}

export default async function PublicBoardPage({ params }: PageProps) {
  const { slug } = await params
  const admin = await createAdminSupabase()

  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board) notFound()

  const { data: feedback } = await admin
    .from('feedback')
    .select('id, message, type, status, vote_count, created_at')
    .eq('project_id', board.project_id)
    .eq('is_public', true)
    .eq('is_archived', false)
    .in('type', board.show_types || ['idea', 'bug'])
    .order('vote_count', { ascending: false })

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

  return (
    <PublicBoard
      board={{
        title: board.title,
        description: board.description,
        slug: board.slug,
        allow_submissions: board.allow_submissions,
        show_types: board.show_types || ['idea', 'bug'],
        branding: board.branding as Record<string, string> | null,
      }}
      initialFeedback={feedback || []}
      initialComments={comments}
    />
  )
}
