import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { Sidebar } from '@/components/sidebar'
import { ProductTour } from '@/components/product-tour'
import { CURRENT_PROJECT_COOKIE } from '@/lib/project-selection'
import { deriveEarlyAdopterStatus, getEarlyAdopterMembershipForUser, isEarlyAdopterFeedbackOpen, isEarlyAdopterProgrammeActive } from '@/lib/early-adopter'
import { ProActivationCelebration } from '@/components/pro-activation-celebration'
import { getProActivationKey, hasActivePro } from '@/lib/pro-activation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [
    { data: projects },
    { data: billingAccount },
    { data: userSettings },
    earlyAdopterMembership,
    headersList,
    cookieStore,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, settings')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_accounts')
      .select('plan_tier, billing_status, complimentary_pro_until, grace_ends_at, current_period_start, last_event_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('preferences')
      .eq('user_id', user.id)
      .maybeSingle(),
    getEarlyAdopterMembershipForUser(user.id),
    headers(),
    cookies(),
  ])

  const projectIds = (projects || []).map((project: { id: string }) => project.id)
  const { data: boardSettings } = projectIds.length > 0
    ? await supabase
        .from('public_board_settings')
        .select('project_id, slug, enabled')
        .eq('enabled', true)
        .in('project_id', projectIds)
    : { data: [] }

  // Extract current project ID from URL path
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  const projectMatch = pathname.match(/\/projects\/([^/]+)/)
  const pathProjectId = projectMatch?.[1]
  const storedProjectId = cookieStore.get(CURRENT_PROJECT_COOKIE)?.value
  const currentProjectId = projects?.find((project) => project.id === pathProjectId)?.id
    || projects?.find((project) => project.id === storedProjectId)?.id

  // Build project → board slug map
  const boardSlugs: Record<string, string> = {}
  boardSettings?.forEach((b: { project_id: string; slug: string }) => {
    boardSlugs[b.project_id] = b.slug
  })

  const preferences =
    userSettings?.preferences && typeof userSettings.preferences === 'object'
      ? (userSettings.preferences as {
        productTourCompletedAt?: string
        productTourDismissedAt?: string
        guidedTutorialProgress?: Record<string, { stepIndex: number; completedAt?: string; dismissedAt?: string }>
        })
      : {}
  const effectiveEarlyAdopterMembership = earlyAdopterMembership
    ? { ...earlyAdopterMembership, status: deriveEarlyAdopterStatus(earlyAdopterMembership) }
    : null
  const requiredEarlyAdopterOnboarding = Boolean(
    effectiveEarlyAdopterMembership
    && ['accepted', 'onboarding'].includes(effectiveEarlyAdopterMembership.status)
  )
  const hasProjectForOnboarding = Boolean(currentProjectId || projects?.[0]?.id)
  const shouldOfferStandardOnboarding = Boolean(
    !requiredEarlyAdopterOnboarding
    && hasProjectForOnboarding
    && !preferences.productTourCompletedAt
    && !preferences.productTourDismissedAt
  )
  return (
    <div className="dashboard-shell flex h-dvh flex-col bg-background md:flex-row">
      <Sidebar
        user={{
          email: user.email,
          user_metadata: user.user_metadata as { avatar_url?: string; full_name?: string },
        }}
        projects={(projects as Array<{ id: string; name: string; settings: { icon?: string } }>) || []}
        currentProjectId={currentProjectId}
        boardSlugs={boardSlugs}
        billingAccount={billingAccount}
        earlyAdopterProgrammeActive={isEarlyAdopterProgrammeActive(effectiveEarlyAdopterMembership)}
        earlyAdopterProgramme={effectiveEarlyAdopterMembership ? {
          status: effectiveEarlyAdopterMembership.status,
          proMonthsEarned: effectiveEarlyAdopterMembership.pro_months_earned,
          feedbackOpensAt: effectiveEarlyAdopterMembership.feedback_opens_at,
          graceEndsAt: effectiveEarlyAdopterMembership.grace_ends_at,
          programmeEndsAt: effectiveEarlyAdopterMembership.programme_ends_at,
          feedbackOpen: isEarlyAdopterFeedbackOpen(effectiveEarlyAdopterMembership),
        } : null}
      />
      <main className="min-h-0 flex-1 overflow-y-auto bg-background pb-[env(safe-area-inset-bottom,0px)]">
        <div className="workspace-route-enter mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 md:px-8 md:py-7">{children}</div>
      </main>
      <ProductTour
        initialOpen={requiredEarlyAdopterOnboarding || shouldOfferStandardOnboarding}
        required={requiredEarlyAdopterOnboarding}
        defaultProjectId={currentProjectId || projects?.[0]?.id}
        initialTutorialProgress={preferences.guidedTutorialProgress}
      />
      <ProActivationCelebration
        userId={user.id}
        active={hasActivePro(billingAccount)}
        activationKey={getProActivationKey(billingAccount)}
      />
    </div>
  )
}
