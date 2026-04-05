import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { assertCanReceiveFeedback, incrementFeedbackUsage } from '@/lib/billing'
import { hasE2EBypass } from '@/lib/e2e'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'
import { hashProjectApiKey } from '@/lib/project-api-keys'
import { checkRateLimit } from '@/lib/rate-limit'
import { enqueueWebhookJobs, processWebhookJobs } from '@/lib/webhook-delivery'
import type { FeedbackType, FeedbackPriority, Project } from '@/lib/types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_TYPES: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS })
}

async function verifyCaptcha(provider: 'turnstile' | 'hcaptcha', token: string): Promise<boolean> {
  // Check that the required secret key env var is set
  const secret = provider === 'turnstile'
    ? process.env.TURNSTILE_SECRET_KEY
    : process.env.HCAPTCHA_SECRET_KEY

  if (!secret) {
    // No secret configured — fail closed
    return false
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    if (provider === 'turnstile') {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      return data.success === true
    }

    if (provider === 'hcaptcha') {
      const res = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      return data.success === true
    }
  } catch {
    // Verification service failure — fail closed
  }
  return false
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
      return jsonError('Too many requests. Please try again later.', 429)
    }

    // Parse body (JSON or FormData)
    const contentType = request.headers.get('content-type') ?? ''
    let fields: Record<string, string> = {}
    let screenshotFile: File | null = null
    let attachmentFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
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
      fields = await request.json()
    }

    // Honeypot check
    if (fields.hp) {
      // Silently accept but don't store — looks successful to bots
      return NextResponse.json({ success: true, id: crypto.randomUUID() }, { headers: CORS_HEADERS })
    }

    // Validate apiKey
    const apiKey = fields.apiKey?.trim()
    if (!apiKey) return jsonError('API key is required', 400)

    const admin = await createAdminSupabase()

    const keyHash = await hashProjectApiKey(apiKey)
    const { data: project } = await admin
      .from('projects')
      .select('id, name, webhooks, settings, owner_user_id')
      .eq('api_key_hash', keyHash)
      .single()

    if (!project) return jsonError('Invalid API key', 401)

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
      const valid = await verifyCaptcha(widgetConfig.captchaProvider, token)
      if (!valid) return jsonError('Captcha verification failed', 400)
    }

    // Upload screenshot
    let screenshotUrl: string | null = null
    if (screenshotFile) {
      const ext = screenshotFile.type === 'image/png' ? 'png' : 'jpeg'
      const path = `${project.id}/${crypto.randomUUID()}.${ext}`
      const buffer = Buffer.from(await screenshotFile.arrayBuffer())
      const { error: uploadErr } = await admin.storage
        .from('feedback_screenshots')
        .upload(path, buffer, { contentType: screenshotFile.type })
      if (!uploadErr) {
        const { data: urlData } = admin.storage.from('feedback_screenshots').getPublicUrl(path)
        screenshotUrl = urlData.publicUrl
      }
    } else if (fields.screenshot && fields.screenshot.startsWith('data:image/')) {
      // Check base64 size before decoding (~5MB decoded limit)
      if (fields.screenshot.length > 7_000_000) {
        return jsonError('Screenshot too large (max ~5MB)', 400)
      }
      const match = fields.screenshot.match(/^data:image\/(png|jpeg);base64,(.+)$/)
      if (match) {
        const ext = match[1]
        const buffer = Buffer.from(match[2], 'base64')
        const path = `${project.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadErr } = await admin.storage
          .from('feedback_screenshots')
          .upload(path, buffer, { contentType: `image/${ext}` })
        if (!uploadErr) {
          const { data: urlData } = admin.storage.from('feedback_screenshots').getPublicUrl(path)
          screenshotUrl = urlData.publicUrl
        }
      }
    }

    // Upload attachment
    let attachments: { url: string; name: string; type: string; size: number }[] | null = null
    if (attachmentFile) {
      if (attachmentFile.size > MAX_ATTACHMENT_SIZE) return jsonError('Attachment too large (max 5MB)', 400)
      if (!ALLOWED_ATTACHMENT_TYPES.includes(attachmentFile.type)) return jsonError('Attachment type not allowed (png, jpeg, pdf only)', 400)

      const safeName = sanitizeFilename(attachmentFile.name)
      const ext = safeName.split('.').pop() ?? 'bin'
      const path = `${project.id}/${crypto.randomUUID()}.${ext}`
      const buffer = Buffer.from(await attachmentFile.arrayBuffer())
      const { error: uploadErr } = await admin.storage
        .from('feedback_attachments')
        .upload(path, buffer, { contentType: attachmentFile.type })
      if (!uploadErr) {
        const { data: urlData } = admin.storage.from('feedback_attachments').getPublicUrl(path)
        attachments = [{
          url: urlData.publicUrl,
          name: safeName,
          type: attachmentFile.type,
          size: attachmentFile.size,
        }]
      }
    }

    // Insert feedback
    const feedbackId = crypto.randomUUID()
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
      screenshot_url: screenshotUrl,
      attachments,
      metadata: {},
      is_archived: false,
      created_at: now,
      updated_at: now,
    }

    const { error: insertErr } = await admin.from('feedback').insert(feedbackRow)
    if (insertErr) {
      console.error('Feedback insert error:', insertErr)
      return jsonError('Failed to save feedback', 500)
    }

    await incrementFeedbackUsage(project.owner_user_id)

    // Queue webhook delivery so retries survive the request lifecycle.
    if (project.webhooks) {
      enqueueWebhookJobs(
        project.webhooks,
        feedbackRow,
        { id: project.id, name: project.name }
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
