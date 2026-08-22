import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { assertCanReceiveFeedback } from '@/lib/billing'
import { hasE2EBypass } from '@/lib/e2e'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'
import { isWidgetRequestOriginAllowed } from '@/lib/origin-allowlist'
import { getPublicProjectLookup } from '@/lib/project-api-keys'
import { publicEnv } from '@/lib/public-env'
import { checkRateLimit } from '@/lib/rate-limit'
import { enqueueWebhookJobs, processWebhookJobs } from '@/lib/webhook-delivery'
import type { FeedbackType, FeedbackPriority, Project } from '@/lib/types'
import { readRequestBodyWithLimit, RequestBodyTooLargeError } from '@/lib/request-body-limit'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import {
  MAX_ATTACHMENT_SIZE,
  MAX_SCREENSHOT_SIZE,
  validateAndSanitizeFeedbackImage,
} from '@/lib/feedback-media-validation'
import { insertFeedbackWithAtomicQuota } from '@/lib/atomic-quota-writes'
import { verifyCaptchaToken } from '@/lib/captcha'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Expose-Headers': 'Idempotency-Replayed, Retry-After',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_TYPES: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']
const MAX_SCREENSHOT_DATA_URL_LENGTH = 4_200_000
const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['image/png', 'image/jpeg']
const ALLOWED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS })
}

/** Sanitize filename: only allow alphanumerics, dots, hyphens, underscores */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const { allowed, remaining } = await checkRateLimit(request, 'feedback', 10, 1)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } },
      )
    }

    // Bound the stream before JSON or multipart parsing, including chunked requests.
    let bodyBytes: Uint8Array
    try {
      bodyBytes = await readRequestBodyWithLimit(request, MAX_REQUEST_BODY_SIZE)
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return jsonError('Request body too large (max 10MB)', 413)
      }
      throw error
    }

    // Parse body (JSON or FormData)
    const contentType = request.headers.get('content-type') ?? ''
    let fields: Record<string, string> = {}
    let screenshotFile: File | null = null
    let attachmentFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const boundedRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: bodyBytes.buffer.slice(
          bodyBytes.byteOffset,
          bodyBytes.byteOffset + bodyBytes.byteLength,
        ) as ArrayBuffer,
      })
      const formData = await boundedRequest.formData()
      for (const [key, value] of formData.entries()) {
        if (key === 'screenshot' && value instanceof File) {
          screenshotFile = value
        } else if (key === 'attachment' && value instanceof File) {
          attachmentFile = value
        } else {
          fields[key] = String(value)
        }
      }
    } else {
      const parsed = JSON.parse(new TextDecoder().decode(bodyBytes))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonError('Request body must be a JSON object', 400)
      }
      fields = parsed as Record<string, string>
    }

    // Honeypot check
    if (fields.hp) {
      // Silently accept without storing so the request looks successful to bots.
      return NextResponse.json({ success: true, id: crypto.randomUUID() }, { headers: CORS_HEADERS })
    }

    // Validate apiKey
    const apiKey = fields.apiKey?.trim()
    if (!apiKey) return jsonError('API key is required', 400)

    const admin = await createAdminSupabase()

    const lookup = await getPublicProjectLookup(apiKey)
    if (!lookup) return jsonError('Invalid project key', 401)
    const { data: project } = await admin
      .from('projects')
      .select('id, name, webhooks, settings, owner_user_id, plan_frozen_at')
      .eq(lookup.column, lookup.value)
      .single()

    if (!project) return jsonError('Invalid project key', 401)
    if (project.plan_frozen_at) return jsonError('This project is frozen because the workspace is over its current plan limit.', 403)
    const projectRate = await checkRateLimit(request, 'feedback-project', 30, 1, project.id)
    if (!projectRate.allowed) {
      return NextResponse.json(
        { error: 'This project is receiving too many submissions. Try again in a minute.' },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } },
      )
    }

    const originAllowed = isWidgetRequestOriginAllowed(
      request,
      (project as Project).settings?.widget_origin_restriction,
      { trustedOrigins: [publicEnv.NEXT_PUBLIC_APP_ORIGIN] },
    )
    if (!originAllowed) {
      return jsonError('This site is not allowed to submit feedback for this project.', 403)
    }

    let webhookEndpointLimit: number | null = null
    if (!hasE2EBypass(request)) {
      const entitlement = await assertCanReceiveFeedback(project.owner_user_id)
      if (!entitlement.allowed) {
        return NextResponse.json(
          {
            error: entitlement.message,
            code: entitlement.code,
          },
          { status: 403, headers: CORS_HEADERS },
        )
      }
      webhookEndpointLimit = entitlement.summary.entitlements.webhookEndpointLimit
    }

    // Validate message
    const message = fields.message?.trim()
    if (!message || message.length < 2) return jsonError('Message must be at least 2 characters', 400)
    if (message.length > 2000) return jsonError('Message must be 2000 characters or less', 400)

    // Validate optional fields
    const email = fields.email?.trim() || null
    if (email && !EMAIL_RE.test(email)) return jsonError('Invalid email format', 400)

    const url = fields.url?.trim() || null
    if (url) {
      try {
        const parsed = new URL(url)
        // Only allow http/https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return jsonError('URL must use http or https protocol', 400)
        }
      } catch { return jsonError('Invalid URL', 400) }
    }

    const type = fields.type?.trim() as FeedbackType | undefined || null
    if (type && !VALID_TYPES.includes(type)) return jsonError('Invalid feedback type', 400)

    const ratingRaw = fields.rating
    let rating: number | null = null
    if (ratingRaw != null && ratingRaw !== '' && ratingRaw !== 'null') {
      rating = parseInt(String(ratingRaw), 10)
      if (isNaN(rating) || rating < 1 || rating > 5) return jsonError('Rating must be 1-5', 400)
    }

    const priority = fields.priority?.trim() as FeedbackPriority | undefined || null
    if (priority && !VALID_PRIORITIES.includes(priority)) return jsonError('Invalid priority', 400)

    let tags: string[] | null = null
    if (fields.tags) {
      try {
        const parsed = typeof fields.tags === 'string' ? JSON.parse(fields.tags) : fields.tags
        if (Array.isArray(parsed)) tags = parsed.map(String).slice(0, 10)
      } catch {
        tags = fields.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10)
      }
    }

    const userAgent = fields.userAgent?.trim() || request.headers.get('user-agent') || ''

    // Captcha verification
    const widgetConfig = (project as Project).settings?.widget_config
    if (widgetConfig?.requireCaptcha && widgetConfig.captchaProvider) {
      const token = widgetConfig.captchaProvider === 'turnstile'
        ? fields.turnstileToken
        : fields.hcaptchaToken
      if (!token) return jsonError('Captcha verification required', 400)
      const verification = await verifyCaptchaToken({
        provider: widgetConfig.captchaProvider,
        token,
        secretKey: widgetConfig.captchaProvider === 'turnstile'
          ? process.env.TURNSTILE_SECRET_KEY
          : process.env.HCAPTCHA_SECRET_KEY,
        siteKey: widgetConfig.captchaProvider === 'turnstile'
          ? widgetConfig.turnstileSiteKey
          : widgetConfig.hcaptchaSiteKey,
      })
      if (!verification.ok) return jsonError('Captcha verification failed', 400)
    }

    const submittedId = fields.submissionId?.trim() || null
    if (submittedId && !UUID_RE.test(submittedId)) {
      return jsonError('Invalid submission identifier', 400)
    }
    const feedbackId = submittedId || crypto.randomUUID()
    const uploadedObjects: Array<{ bucket: string; path: string }> = []
    const mediaRows: Array<Record<string, unknown>> = []
    const cleanupUploadedObjects = () => Promise.all(
      uploadedObjects.map((object) => admin.storage.from(object.bucket).remove([object.path])),
    )
    let screenshotPath: string | null = null

    // Screenshots and attachments are validated, metadata-stripped, and stored privately.
    if (screenshotFile) {
      if (screenshotFile.size > MAX_SCREENSHOT_SIZE) return jsonError('Screenshot too large (max 3MB)', 400)
      if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshotFile.type)) return jsonError('Screenshot type not allowed (png or jpeg only)', 400)

      const buffer = Buffer.from(await screenshotFile.arrayBuffer())
      let validated
      try {
        validated = await validateAndSanitizeFeedbackImage({
          buffer,
          claimedMimeType: screenshotFile.type,
          originalFilename: screenshotFile.name || 'feedback-screenshot',
          maxBytes: MAX_SCREENSHOT_SIZE,
        })
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Screenshot is invalid', 400)
      }
      const path = `${project.id}/${feedbackId}/${crypto.randomUUID()}.${validated.extension}`
      const { error: uploadErr } = await admin.storage
        .from('feedback_screenshots')
        .upload(path, validated.buffer, { contentType: validated.mimeType, upsert: false })
      if (!uploadErr) {
        screenshotPath = path
        uploadedObjects.push({ bucket: 'feedback_screenshots', path })
        mediaRows.push({
          feedback_id: feedbackId,
          project_id: project.id,
          kind: 'screenshot',
          bucket: 'feedback_screenshots',
          storage_path: path,
          original_filename: screenshotFile.name || validated.safeFilename,
          safe_filename: validated.safeFilename,
          mime_type: validated.mimeType,
          size_bytes: validated.size,
          sha256: validated.sha256,
          scan_status: 'clean',
          scanned_at: new Date().toISOString(),
        })
      } else {
        return jsonError('Failed to upload screenshot', 500)
      }
    } else if (fields.screenshot && fields.screenshot.startsWith('data:image/')) {
      // Check base64 size before decoding (~3MB decoded limit)
      if (fields.screenshot.length > MAX_SCREENSHOT_DATA_URL_LENGTH) {
        return jsonError('Screenshot too large (max 3MB)', 400)
      }
      const match = fields.screenshot.match(/^data:image\/(png|jpeg);base64,(.+)$/)
      if (match) {
        const buffer = Buffer.from(match[2], 'base64')
        if (buffer.length > MAX_SCREENSHOT_SIZE) return jsonError('Screenshot too large (max 3MB)', 400)
        let validated
        try {
          validated = await validateAndSanitizeFeedbackImage({
            buffer,
            claimedMimeType: `image/${match[1]}`,
            originalFilename: `feedback-screenshot.${match[1]}`,
            maxBytes: MAX_SCREENSHOT_SIZE,
          })
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : 'Screenshot is invalid', 400)
        }
        const path = `${project.id}/${feedbackId}/${crypto.randomUUID()}.${validated.extension}`
        const { error: uploadErr } = await admin.storage
          .from('feedback_screenshots')
          .upload(path, validated.buffer, { contentType: validated.mimeType, upsert: false })
        if (!uploadErr) {
          screenshotPath = path
          uploadedObjects.push({ bucket: 'feedback_screenshots', path })
          mediaRows.push({
            feedback_id: feedbackId,
            project_id: project.id,
            kind: 'screenshot',
            bucket: 'feedback_screenshots',
            storage_path: path,
            original_filename: validated.safeFilename,
            safe_filename: validated.safeFilename,
            mime_type: validated.mimeType,
            size_bytes: validated.size,
            sha256: validated.sha256,
            scan_status: 'clean',
            scanned_at: new Date().toISOString(),
          })
        } else {
          return jsonError('Failed to upload screenshot', 500)
        }
      }
    }

    // Upload attachment
    let attachments: { mediaId: string; name: string; type: string; size: number }[] | null = null
    if (attachmentFile) {
      if (attachmentFile.size > MAX_ATTACHMENT_SIZE) {
        await cleanupUploadedObjects()
        return jsonError('Attachment too large (max 5MB)', 400)
      }
      if (!ALLOWED_ATTACHMENT_TYPES.includes(attachmentFile.type)) {
        await cleanupUploadedObjects()
        return jsonError('Attachment type not allowed. PNG and JPEG are supported; PDF is disabled until malware scanning is configured.', 400)
      }

      const safeName = sanitizeFilename(attachmentFile.name)
      const buffer = Buffer.from(await attachmentFile.arrayBuffer())
      let validated
      try {
        validated = await validateAndSanitizeFeedbackImage({
          buffer,
          claimedMimeType: attachmentFile.type,
          originalFilename: safeName,
          maxBytes: MAX_ATTACHMENT_SIZE,
        })
      } catch (error) {
        await cleanupUploadedObjects()
        return jsonError(error instanceof Error ? error.message : 'Attachment is invalid', 400)
      }
      const mediaId = crypto.randomUUID()
      const path = `${project.id}/${feedbackId}/${mediaId}.${validated.extension}`
      const { error: uploadErr } = await admin.storage
        .from('feedback_attachments')
        .upload(path, validated.buffer, { contentType: validated.mimeType, upsert: false })
      if (!uploadErr) {
        uploadedObjects.push({ bucket: 'feedback_attachments', path })
        attachments = [{
          mediaId,
          name: validated.safeFilename,
          type: validated.mimeType,
          size: validated.size,
        }]
        mediaRows.push({
          id: mediaId,
          feedback_id: feedbackId,
          project_id: project.id,
          kind: 'attachment',
          bucket: 'feedback_attachments',
          storage_path: path,
          original_filename: safeName,
          safe_filename: validated.safeFilename,
          mime_type: validated.mimeType,
          size_bytes: validated.size,
          sha256: validated.sha256,
          scan_status: 'clean',
          scanned_at: new Date().toISOString(),
        })
      } else {
        await cleanupUploadedObjects()
        return jsonError('Failed to upload attachment', 500)
      }
    }

    // Insert feedback
    const now = new Date().toISOString()
    const feedbackRow = {
      id: feedbackId,
      project_id: project.id,
      message,
      email,
      url,
      user_agent: userAgent,
      type,
      rating,
      priority: priority || 'low',
      status: 'new' as const,
      tags: tags || [],
      screenshot_url: null,
      screenshot_path: screenshotPath,
      attachments,
      metadata: { source: 'widget' },
      is_public: false,
      is_archived: false,
      read_at: null,
      created_at: now,
      updated_at: now,
    }

    let write
    try {
      write = await insertFeedbackWithAtomicQuota({
        admin,
        feedback: feedbackRow,
        media: mediaRows,
        bypassQuota: hasE2EBypass(request),
        allowReplay: Boolean(submittedId),
        recordFirstFeedback: true,
      })
    } catch (insertErr) {
      await cleanupUploadedObjects()
      console.error('Feedback insert error:', insertErr)
      return jsonError('Failed to save feedback', 500)
    }
    if (write.status === 'replayed') {
      await cleanupUploadedObjects()
      return NextResponse.json(
        { success: true, id: write.feedbackId, replayed: true },
        { headers: { ...CORS_HEADERS, 'Idempotency-Replayed': 'true' } },
      )
    }
    if (write.status === 'quota_reached') {
      await cleanupUploadedObjects()
      return NextResponse.json({
        error: 'This project has reached its monthly feedback limit. Upgrade to Pro to continue collecting feedback.',
        code: 'feedback_quota_reached',
      }, { status: 403, headers: CORS_HEADERS })
    }
    if (write.status === 'project_frozen') {
      await cleanupUploadedObjects()
      return jsonError('This project is frozen because the workspace is over its current plan limit.', 403)
    }
    if (write.status === 'project_not_found') {
      await cleanupUploadedObjects()
      return jsonError('Invalid project key', 401)
    }
    if (write.status === 'id_conflict') {
      await cleanupUploadedObjects()
      return jsonError('Failed to save feedback', 500)
    }

    await recordActivationMilestone({
      projectId: project.id,
      userId: project.owner_user_id,
      eventName: 'first_feedback_received',
      admin,
    })

    // Queue webhook delivery so retries survive the request lifecycle.
    if (project.webhooks) {
      enqueueWebhookJobs(
        project.webhooks,
        feedbackRow,
        { id: project.id, name: project.name },
        'feedback.new',
        webhookEndpointLimit,
      )
        .then((jobIds) => {
          if (jobIds.length > 0) {
            void processWebhookJobs({ jobIds, limit: jobIds.length })
          }
        })
        .catch(() => {})
    }

    void notifyProjectOwnerOfNewFeedback(
      { id: project.id, name: project.name, owner_user_id: project.owner_user_id },
      {
        message: feedbackRow.message,
        type: feedbackRow.type,
        email: feedbackRow.email,
        url: feedbackRow.url,
        rating: feedbackRow.rating,
        created_at: feedbackRow.created_at,
      },
    )

    return NextResponse.json(
      { success: true, id: feedbackId },
      {
        status: 201,
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    )
  } catch (err) {
    console.error('Feedback submission error:', err)
    return jsonError('Internal server error', 500)
  }
}
