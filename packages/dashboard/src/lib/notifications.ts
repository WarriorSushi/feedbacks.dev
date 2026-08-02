import { env, isEmailEnabled } from '@/lib/env'
import { createAdminSupabase } from '@/lib/supabase-server'
export { escapeEmailHtml } from './notification-html'
import { escapeEmailHtml } from './notification-html'
import type { Feedback, NotificationSettings, Project } from '@/lib/types'
import { hashEmailRecipient } from './resend-webhooks'
import {
  buildPublicBoardReplyEmail,
  buildPublicBoardStatusEmail,
  mergePublicBoardSubscriberIds,
  type PublicBoardNotificationBoard,
  type PublicBoardNotificationFeedback,
} from './public-board-notifications'

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

async function sendResendEmail(payload: EmailPayload) {
  if (!isEmailEnabled()) return false
  const admin = await createAdminSupabase()
  const { data: suppression, error: suppressionError } = await admin
    .from('email_suppressions')
    .select('recipient_hash')
    .eq('recipient_hash', hashEmailRecipient(payload.to))
    .maybeSingle()
  if (suppressionError) {
    throw new Error(`Could not check email suppression: ${suppressionError.message}`)
  }
  if (suppression) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Resend failed with ${response.status}`)
  }

  return true
}

export async function getUserNotificationSettings(userId: string) {
  const admin = await createAdminSupabase()
  const [{ data: settingsRow }, { data: userRes }] = await Promise.all([
    admin
      .from('user_settings')
      .select('notification_settings')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ])

  const notificationSettings = (settingsRow?.notification_settings || {}) as NotificationSettings
  const emailAddress = notificationSettings.emailAddress || userRes.user?.email || null

  return {
    notificationSettings,
    emailAddress,
  }
}

export async function notifyProjectOwnerOfNewFeedback(
  project: Pick<Project, 'id' | 'name' | 'owner_user_id'>,
  feedback: Pick<Feedback, 'message' | 'type' | 'email' | 'url' | 'rating' | 'created_at'>,
) {
  try {
    const { notificationSettings, emailAddress } = await getUserNotificationSettings(project.owner_user_id)
    if (!notificationSettings.email || !emailAddress) return

    const subject = `[feedbacks.dev] New ${feedback.type || 'feedback'} on ${project.name}`
    const safeSubject = escapeEmailHtml(subject)
    const safeProjectName = escapeEmailHtml(project.name)
    const safeType = escapeEmailHtml(feedback.type || 'feedback')
    const safeMessage = escapeEmailHtml(feedback.message)
    const safeReporterEmail = feedback.email ? escapeEmailHtml(feedback.email) : null
    const safeUrl = feedback.url ? escapeEmailHtml(feedback.url) : null
    const lines = [
      `Project: ${project.name}`,
      `Type: ${feedback.type || 'feedback'}`,
      `Message: ${feedback.message}`,
      feedback.email ? `Reporter email: ${feedback.email}` : null,
      feedback.url ? `URL: ${feedback.url}` : null,
      feedback.rating ? `Rating: ${feedback.rating}/5` : null,
      feedback.created_at ? `Created: ${feedback.created_at}` : null,
    ].filter(Boolean)

    await sendResendEmail({
      to: emailAddress,
      subject,
      text: lines.join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${safeSubject}</h2>
          <p><strong>Project:</strong> ${safeProjectName}</p>
          <p><strong>Type:</strong> ${safeType}</p>
          <p><strong>Message:</strong><br/>${safeMessage}</p>
          ${safeReporterEmail ? `<p><strong>Reporter email:</strong> ${safeReporterEmail}</p>` : ''}
          ${safeUrl ? `<p><strong>URL:</strong> ${safeUrl}</p>` : ''}
          ${feedback.rating ? `<p><strong>Rating:</strong> ${feedback.rating}/5</p>` : ''}
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send new feedback notification', error)
  }
}

export async function notifyUserOfWebhookFailure(userId: string, projectName: string, endpointUrl: string) {
  try {
    const { notificationSettings, emailAddress } = await getUserNotificationSettings(userId)
    if (!notificationSettings.email || !notificationSettings.webhookFailures || !emailAddress) return

    const safeProjectName = escapeEmailHtml(projectName)
    const safeEndpointUrl = escapeEmailHtml(endpointUrl)
    await sendResendEmail({
      to: emailAddress,
      subject: `[feedbacks.dev] Webhook disabled for ${projectName}`,
      text: `An integration endpoint was auto-disabled after repeated failures.\n\nProject: ${projectName}\nEndpoint: ${endpointUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Webhook disabled for ${safeProjectName}</h2>
          <p>An integration endpoint was auto-disabled after repeated failures.</p>
          <p><strong>Endpoint:</strong> ${safeEndpointUrl}</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send webhook failure notification', error)
  }
}

export async function notifyUserOfBillingFailure(input: {
  userId: string
  billingEmail?: string | null
  reason?: string
}) {
  try {
    const { notificationSettings, emailAddress } = await getUserNotificationSettings(input.userId)
    const recipient = input.billingEmail || emailAddress
    if (!recipient || notificationSettings.billingFailures === false) return
    const reason = input.reason || 'A payment failed or your subscription needs attention.'
    const safeReason = escapeEmailHtml(reason)

    await sendResendEmail({
      to: recipient,
      subject: '[feedbacks.dev] Billing needs attention',
      text: `${reason}\n\nOpen Billing in feedbacks.dev to update your subscription.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Billing needs attention</h2>
          <p>${safeReason}</p>
          <p>Open Billing in feedbacks.dev to review your plan, payment method, or renewal state.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send billing failure notification', error)
  }
}

export async function notifyUserOfDowngradeGrace(input: {
  userId: string
  billingEmail?: string | null
  day: 1 | 2 | 3
  graceEndsAt: string
  freeProjectLimit: number
}) {
  try {
    const { emailAddress } = await getUserNotificationSettings(input.userId)
    const recipient = input.billingEmail || emailAddress
    if (!recipient) return false
    const endDate = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })
      .format(new Date(input.graceEndsAt))
    const messages = {
      1: {
        subject: 'Three days left on your Pro plan',
        heading: 'Your paid Pro access ends in three days',
        body: `Your Pro access is scheduled to move to Free ${endDate}. Your paid period or complimentary access remains active until then. If you stay on Free, your ${input.freeProjectLimit} most recently active projects remain live and additional projects are frozen, not deleted.`,
        action: 'Renew before the paid-through date to keep every project live without interruption.',
      },
      2: {
        subject: 'Two days left to keep every project live',
        heading: 'A quick heads-up about your workspace',
        body: `Your paid Pro period ends ${endDate}. At that time, Free limits apply automatically, including branding, dashboard history, usage quotas, and project limits.`,
        action: 'Nothing is deleted. Renewing Pro restores all paid features immediately.',
      },
      3: {
        subject: 'Final paid day of Pro access',
        heading: 'Pro access ends today',
        body: `At ${endDate}, feedbacks.dev will move your workspace to Free. Your ${input.freeProjectLimit} most recently active projects stay live; extra projects are frozen and can be restored by upgrading.`,
        action: 'Renew before the deadline if you need uninterrupted collection across every project.',
      },
    } as const
    const message = messages[input.day]
    const billingUrl = `${env.NEXT_PUBLIC_APP_ORIGIN}/billing`
    await sendResendEmail({
      to: recipient,
      subject: `[feedbacks.dev] ${message.subject}`,
      text: `${message.heading}\n\n${message.body}\n\n${message.action}\n\nReview billing: ${billingUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.55;color:#17211b;max-width:560px">
          <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2f7d4a">Plan change notice, day ${input.day} of 3</p>
          <h2>${escapeEmailHtml(message.heading)}</h2>
          <p>${escapeEmailHtml(message.body)}</p>
          <p>${escapeEmailHtml(message.action)}</p>
          <p><a href="${escapeEmailHtml(billingUrl)}" style="display:inline-block;padding:10px 14px;border-radius:6px;background:#1f7a46;color:#f7fbf8;text-decoration:none;font-weight:700">Review billing</a></p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send downgrade warning notification', error)
    return false
  }
}

async function getPublicBoardRecipientEmails(input: {
  boardId: string
  feedbackId: string
  excludeUserId?: string | null
}) {
  const admin = await createAdminSupabase()
  const [{ data: follows }, { data: watches }] = await Promise.all([
    admin.from('board_follows').select('user_id').eq('board_id', input.boardId),
    admin.from('feedback_watches').select('user_id').eq('feedback_id', input.feedbackId),
  ])

  const userIds = mergePublicBoardSubscriberIds({
    followUserIds: ((follows || []) as Array<{ user_id: string }>).map((row) => row.user_id),
    watchUserIds: ((watches || []) as Array<{ user_id: string }>).map((row) => row.user_id),
    excludeUserId: input.excludeUserId,
  })

  const emailResults = await Promise.all(
    userIds.map(async (userId) => {
      const { data: settingsRow } = await admin
        .from('user_settings')
        .select('notification_settings')
        .eq('user_id', userId)
        .maybeSingle()
      const settings = (settingsRow?.notification_settings || {}) as NotificationSettings
      if (settings.email === false) return null

      const { data } = await admin.auth.admin.getUserById(userId)
      return settings.emailAddress || data.user?.email || null
    }),
  )

  return Array.from(new Set(emailResults.filter((email): email is string => Boolean(email))))
}

export async function notifyPublicBoardSubscribersOfStatusChange(input: {
  board: PublicBoardNotificationBoard
  feedback: PublicBoardNotificationFeedback
  oldStatus?: string | null
  newStatus: string
  actorUserId?: string | null
}) {
  if (!isEmailEnabled()) return { sent: 0 }
  if (input.oldStatus === input.newStatus) return { sent: 0 }

  try {
    const recipients = await getPublicBoardRecipientEmails({
      boardId: input.board.id,
      feedbackId: input.feedback.id,
      excludeUserId: input.actorUserId,
    })
    if (recipients.length === 0) return { sent: 0 }

    const { subject, text, html } = buildPublicBoardStatusEmail({
      appOrigin: env.NEXT_PUBLIC_APP_ORIGIN,
      board: input.board,
      feedback: input.feedback,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
    })

    const results = await Promise.allSettled(
      recipients.map((to) => sendResendEmail({ to, subject, text, html })),
    )
    return { sent: results.filter((result) => result.status === 'fulfilled').length }
  } catch (error) {
    console.error('Failed to send public board status notifications', error)
    return { sent: 0 }
  }
}

export async function notifyPublicBoardSubscribersOfTeamReply(input: {
  board: PublicBoardNotificationBoard
  feedback: PublicBoardNotificationFeedback
  replyContent: string
  actorUserId?: string | null
}) {
  if (!isEmailEnabled()) return { sent: 0 }

  try {
    const recipients = await getPublicBoardRecipientEmails({
      boardId: input.board.id,
      feedbackId: input.feedback.id,
      excludeUserId: input.actorUserId,
    })
    if (recipients.length === 0) return { sent: 0 }

    const { subject, text, html } = buildPublicBoardReplyEmail({
      appOrigin: env.NEXT_PUBLIC_APP_ORIGIN,
      board: input.board,
      feedback: input.feedback,
      replyContent: input.replyContent,
    })

    const results = await Promise.allSettled(
      recipients.map((to) => sendResendEmail({ to, subject, text, html })),
    )
    return { sent: results.filter((result) => result.status === 'fulfilled').length }
  } catch (error) {
    console.error('Failed to send public board reply notifications', error)
    return { sent: 0 }
  }
}

interface DigestFeedbackRow {
  id: string
  message: string
  type: string | null
  created_at: string
  project_id: string
}

interface DigestProjectRow {
  id: string
  name: string
}

export async function sendDailyFeedbackDigest(userId: string, windowStart: string, windowEnd: string) {
  try {
    const { notificationSettings, emailAddress } = await getUserNotificationSettings(userId)
    if (!notificationSettings.dailyDigest || !emailAddress) {
      return { sent: false as const, count: 0 }
    }

    const admin = await createAdminSupabase()
    const { data: projects } = await admin
      .from('projects')
      .select('id, name')
      .eq('owner_user_id', userId)

    const ownedProjects = (projects || []) as DigestProjectRow[]
    if (ownedProjects.length === 0) {
      return { sent: false as const, count: 0 }
    }

    const projectIds = ownedProjects.map((project) => project.id)
    const { data: feedbackRows } = await admin
      .from('feedback')
      .select('id, message, type, created_at, project_id')
      .in('project_id', projectIds)
      .eq('is_archived', false)
      .gte('created_at', windowStart)
      .lt('created_at', windowEnd)
      .order('created_at', { ascending: false })

    const feedback = (feedbackRows || []) as DigestFeedbackRow[]
    if (feedback.length === 0) {
      return { sent: false as const, count: 0 }
    }

    const projectNameById = new Map(ownedProjects.map((project) => [project.id, project.name]))
    const grouped = new Map<string, DigestFeedbackRow[]>()
    for (const item of feedback) {
      const next = grouped.get(item.project_id) || []
      next.push(item)
      grouped.set(item.project_id, next)
    }

    const htmlSections = Array.from(grouped.entries())
      .map(([projectId, items]) => {
        const title = escapeEmailHtml(projectNameById.get(projectId) || 'Project')
        const list = items
          .slice(0, 5)
          .map((item) => `<li><strong>${escapeEmailHtml(item.type || 'feedback')}:</strong> ${escapeEmailHtml(item.message)}</li>`)
          .join('')
        const extra = items.length > 5 ? `<p style="color:#6b7280;">+${items.length - 5} more</p>` : ''
        return `<div style="margin-bottom:20px;"><h3>${title} (${items.length})</h3><ul>${list}</ul>${extra}</div>`
      })
      .join('')

    const textSections = Array.from(grouped.entries())
      .map(([projectId, items]) => {
        const title = projectNameById.get(projectId) || 'Project'
        const lines = items
          .slice(0, 5)
          .map((item) => `- ${item.type || 'feedback'}: ${item.message}`)
          .join('\n')
        const extra = items.length > 5 ? `\n+${items.length - 5} more` : ''
        return `${title} (${items.length})\n${lines}${extra}`
      })
      .join('\n\n')

    await sendResendEmail({
      to: emailAddress,
      subject: `[feedbacks.dev] Daily feedback digest (${feedback.length})`,
      text: `Feedback received between ${windowStart} and ${windowEnd}\n\n${textSections}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Daily feedback digest</h2>
          <p>Feedback received between ${windowStart} and ${windowEnd}.</p>
          ${htmlSections}
        </div>
      `,
    })

    return { sent: true as const, count: feedback.length }
  } catch (error) {
    console.error('Failed to send daily feedback digest', error)
    return { sent: false as const, count: 0 }
  }
}
