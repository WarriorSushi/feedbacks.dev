import { env, isEmailEnabled } from '@/lib/env'
import { createAdminSupabase } from '@/lib/supabase-server'
import type { Feedback, NotificationSettings, Project } from '@/lib/types'

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

async function sendResendEmail(payload: EmailPayload) {
  if (!isEmailEnabled()) return false

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
          <h2>${subject}</h2>
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Type:</strong> ${feedback.type || 'feedback'}</p>
          <p><strong>Message:</strong><br/>${feedback.message}</p>
          ${feedback.email ? `<p><strong>Reporter email:</strong> ${feedback.email}</p>` : ''}
          ${feedback.url ? `<p><strong>URL:</strong> ${feedback.url}</p>` : ''}
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

    await sendResendEmail({
      to: emailAddress,
      subject: `[feedbacks.dev] Webhook disabled for ${projectName}`,
      text: `An integration endpoint was auto-disabled after repeated failures.\n\nProject: ${projectName}\nEndpoint: ${endpointUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Webhook disabled for ${projectName}</h2>
          <p>An integration endpoint was auto-disabled after repeated failures.</p>
          <p><strong>Endpoint:</strong> ${endpointUrl}</p>
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

    await sendResendEmail({
      to: recipient,
      subject: '[feedbacks.dev] Billing needs attention',
      text: `${input.reason || 'A payment failed or your subscription needs attention.'}\n\nOpen Billing in feedbacks.dev to update your subscription.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Billing needs attention</h2>
          <p>${input.reason || 'A payment failed or your subscription needs attention.'}</p>
          <p>Open Billing in feedbacks.dev to review your plan, payment method, or renewal state.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send billing failure notification', error)
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
        const title = projectNameById.get(projectId) || 'Project'
        const list = items
          .slice(0, 5)
          .map((item) => `<li><strong>${item.type || 'feedback'}:</strong> ${item.message}</li>`)
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
