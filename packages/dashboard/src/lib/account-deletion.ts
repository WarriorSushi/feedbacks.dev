import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { cleanupFeedbackStorageForUserProjects } from '@/lib/feedback-storage-cleanup'

export type AccountDeletionJob = Database['public']['Tables']['account_deletion_jobs']['Row']

function retryAt(attemptCount: number) {
  const minutes = Math.min(24 * 60, 2 ** Math.min(attemptCount, 10))
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

export async function processAccountDeletionJob(
  admin: SupabaseClient<Database>,
  job: AccountDeletionJob,
) {
  if (!job.claim_token) throw new Error('Account deletion job is not claimed')
  const claimToken = job.claim_token

  try {
    const { data: billing, error: billingError } = await admin
      .from('billing_accounts')
      .select('plan_tier, billing_status')
      .eq('user_id', job.user_id)
      .maybeSingle()
    if (billingError) throw billingError

    if (
      billing?.plan_tier === 'pro' &&
      ['active', 'trialing', 'pending'].includes(billing.billing_status)
    ) {
      await admin
        .from('account_deletion_jobs')
        .update({
          status: 'blocked',
          locked_at: null,
          claim_token: null,
          last_error: 'An active subscription must be cancelled before deletion.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('claim_token', claimToken)
      return { status: 'blocked' as const }
    }

    await cleanupFeedbackStorageForUserProjects(admin, job.user_id)
    await admin.from('billing_events').delete().eq('user_id', job.user_id)
    await admin.from('billing_accounts').delete().eq('user_id', job.user_id)
    await admin.from('user_settings').delete().eq('user_id', job.user_id)
    await admin.from('projects').delete().eq('owner_user_id', job.user_id)

    const { error: authError } = await admin.auth.admin.deleteUser(job.user_id)
    if (authError && !/not found/i.test(authError.message)) throw authError

    await admin
      .from('account_deletion_jobs')
      .delete()
      .eq('id', job.id)
      .eq('claim_token', claimToken)
    return { status: 'completed' as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account deletion failed'
    await admin
      .from('account_deletion_jobs')
      .update({
        status: 'failed',
        locked_at: null,
        claim_token: null,
        next_attempt_at: retryAt(job.attempt_count),
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .eq('claim_token', claimToken)
    return { status: 'failed' as const }
  }
}

export async function processAccountDeletionJobs(
  admin: SupabaseClient<Database>,
  options: { limit?: number; userId?: string } = {},
) {
  const { data, error } = await admin.rpc('claim_account_deletion_jobs', {
    p_limit: options.limit || 10,
    p_user_id: options.userId,
  })
  if (error) throw error

  const results = []
  for (const job of data || []) {
    results.push({
      id: job.id,
      ...(await processAccountDeletionJob(admin, job)),
    })
  }
  return results
}
