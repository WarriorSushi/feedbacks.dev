import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import { recordActivationMilestone, type ActivationMilestone } from '@/lib/activation-milestones'
import { readJsonBody } from '@/lib/api-request'

const CLIENT_MILESTONES = new Set<ActivationMilestone>([
  'install_code_copied',
  'verification_completed',
  'first_feedback_triaged',
  'updates_nav_opened',
  'updates_setup_started',
  'updates_install_method_selected',
  'updates_embed_verified',
  'updates_activated',
  'updates_private_test_opened',
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bodyResult = await readJsonBody<{ event?: string }>(request, { maxBytes: 2_048 })
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
  const eventName = body?.event as ActivationMilestone | undefined
  if (!eventName || !CLIENT_MILESTONES.has(eventName)) {
    return NextResponse.json({ error: 'Unsupported activation milestone' }, { status: 400 })
  }

  const admin = await createAdminSupabase()
  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .maybeSingle()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await recordActivationMilestone({ projectId: id, userId: user.id, eventName, admin })
  return NextResponse.json({ recorded: true })
}
