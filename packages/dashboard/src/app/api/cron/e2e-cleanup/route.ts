import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { cleanupFeedbackStorageForProjectIds } from '@/lib/feedback-storage-cleanup'
import { finishCronRun, startCronRun } from '@/lib/cron-runs'
import { getRequestId, logOperationalEvent } from '@/lib/operational-logging'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminSupabase()
  let cronRunId: string | null = null
  try {
    cronRunId = await startCronRun(admin, 'e2e_cleanup')
    const { data: expired, error } = await admin
      .from('projects')
      .select('id')
      .eq('environment', 'e2e')
      .not('expires_at', 'is', null)
      .lte('expires_at', new Date().toISOString())
      .limit(100)

    if (error) throw error
    const projectIds = (expired || []).map((project) => project.id)
    if (projectIds.length === 0) {
      await finishCronRun(admin, cronRunId, { status: 'succeeded', processedCount: 0 })
      logOperationalEvent('info', 'e2e_cleanup.cron_completed', requestId, { deletedProjects: 0 })
      return NextResponse.json({ deletedProjects: 0 })
    }

    const storage = await cleanupFeedbackStorageForProjectIds(admin, projectIds)
    const { error: deleteError } = await admin
      .from('projects')
      .delete()
      .in('id', projectIds)
      .eq('environment', 'e2e')
    if (deleteError) throw deleteError

    await finishCronRun(admin, cronRunId, {
      status: 'succeeded',
      processedCount: projectIds.length,
      metadata: { storage },
    })
    logOperationalEvent('info', 'e2e_cleanup.cron_completed', requestId, {
      deletedProjects: projectIds.length,
      storageRemoved: storage.screenshots + storage.attachments + storage.productUpdateImages,
    })
    return NextResponse.json({ deletedProjects: projectIds.length, storage })
  } catch (error) {
    await finishCronRun(admin, cronRunId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'E2E cleanup failed',
    })
    logOperationalEvent('error', 'e2e_cleanup.cron_failed', requestId, {
      error: error instanceof Error ? error.message : 'E2E cleanup failed',
    })
    return NextResponse.json({ error: 'E2E cleanup failed' }, { status: 500 })
  }
}
