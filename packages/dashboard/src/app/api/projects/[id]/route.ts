import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { sanitizeWidgetOriginRestriction } from '@/lib/origin-allowlist'
import { cleanupFeedbackStorageForProjectIds } from '@/lib/feedback-storage-cleanup'
import { mergeOwnerEditableWidgetConfig, sanitizeSavedWidgetConfig } from '@feedbacks/shared'
import { readJsonBody } from '@/lib/api-request'
import { normalizeProjectDomain } from '@/lib/project-input'
import {
  editConflictResponse,
  formatVersionEtag,
  parseIfMatchVersion,
} from '@/lib/optimistic-concurrency'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { project, admin } = result

    // Get feedback stats
    const { count: totalFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    const { count: newFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'new')

    const { data: avgData } = await admin
      .rpc('avg_rating_for_project', { p_project_id: id })

    return NextResponse.json(
      {
        ...project,
        stats: {
          totalFeedback: totalFeedback ?? 0,
          newFeedback: newFeedback ?? 0,
          avgRating: avgData ?? null,
        },
      },
      { headers: { ETag: formatVersionEtag(project.updated_at) } },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { admin, project } = result as Exclude<typeof result, { error: NextResponse }>
    const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
    if (!expectedVersion) {
      return NextResponse.json(
        {
          code: 'PRECONDITION_REQUIRED',
          error: 'Reload this project before saving so newer changes are not overwritten.',
        },
        { status: 428, headers: { ETag: formatVersionEtag(project.updated_at) } },
      )
    }
    if (expectedVersion !== project.updated_at) {
      return NextResponse.json(editConflictResponse(project.updated_at), {
        status: 409,
        headers: { ETag: formatVersionEtag(project.updated_at) },
      })
    }
    const bodyResult = await readJsonBody<{
      name?: string
      domain?: string | null
      settings?: Record<string, unknown>
      webhooks?: unknown
    }>(request)
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
    const allowedTopLevel = new Set(['name', 'domain', 'settings'])
    if (Object.keys(body).some((key) => !allowedTopLevel.has(key))) {
      return NextResponse.json({ error: 'Use the dedicated endpoint for this project setting.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) {
      const name = body.name?.trim()
      if (!name || name.length > 80) return NextResponse.json({
        error: 'Review the highlighted project name.',
        fieldErrors: { name: ['Project name must be 1–80 characters.'] },
      }, { status: 400 })
      updates.name = name
    }
    if (body.domain !== undefined) {
      const domain = normalizeProjectDomain(body.domain)
      if (domain === undefined) return NextResponse.json({
        error: 'Review the highlighted domain.',
        fieldErrors: { domain: ['Enter a valid website domain or URL.'] },
      }, { status: 400 })
      updates.domain = domain
    }

    if (body.settings !== undefined) {
      if (typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings)) {
        return NextResponse.json({ error: 'settings must be a plain object' }, { status: 400 })
      }
      const allowedSettings = new Set(['widget_config', 'widget_origin_restriction'])
      if (Object.keys(body.settings).some((key) => !allowedSettings.has(key))) {
        return NextResponse.json({ error: 'Only widget configuration and allowed origins can be changed here.' }, { status: 400 })
      }
      const settings = { ...(project.settings || {}) } as Record<string, unknown>
      if ('widget_config' in body.settings) {
        const widgetConfig = body.settings.widget_config
        if (typeof widgetConfig !== 'object' || widgetConfig === null || Array.isArray(widgetConfig)) {
          return NextResponse.json({
            error: 'Review the highlighted feedback form fields.',
            fieldErrors: { widget_config: ['Feedback form settings must be an object.'] },
          }, { status: 400 })
        }
        const primaryColor = (widgetConfig as Record<string, unknown>).primaryColor
        if (typeof primaryColor !== 'string' || !/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(primaryColor.trim())) {
          return NextResponse.json({
            error: 'Review the highlighted feedback form field.',
            fieldErrors: { primaryColor: ['Enter a hex color such as #6366f1.'] },
          }, { status: 400 })
        }
        settings.widget_config = mergeOwnerEditableWidgetConfig(
          project.settings?.widget_config,
          widgetConfig as Parameters<typeof sanitizeSavedWidgetConfig>[0] & object,
        )
      }
      if ('widget_origin_restriction' in body.settings) {
        settings.widget_origin_restriction = sanitizeWidgetOriginRestriction(body.settings.widget_origin_restriction)
      }
      updates.settings = settings
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No supported project changes were provided.' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('updated_at', expectedVersion)
      .select()
      .maybeSingle()
    if (error) return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    if (!data) {
      const { data: latest } = await admin
        .from('projects')
        .select('updated_at')
        .eq('id', id)
        .maybeSingle()
      const currentVersion = latest?.updated_at || project.updated_at
      return NextResponse.json(editConflictResponse(currentVersion), {
        status: 409,
        headers: { ETag: formatVersionEtag(currentVersion) },
      })
    }

    return NextResponse.json(data, {
      headers: { ETag: formatVersionEtag(data.updated_at) },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { admin } = result

    await cleanupFeedbackStorageForProjectIds(admin, [id])

    // Rely on CASCADE for related records (feedback, webhook_deliveries, etc.)
    const { error } = await admin.from('projects').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
