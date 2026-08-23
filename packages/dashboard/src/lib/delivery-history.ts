import type { WebhookDeliveryLog } from '@/lib/webhook-config'

export interface EmailDeliveryLog {
  id: string
  event_type: string
  provider_email_id: string | null
  reason: string | null
  occurred_at: string
}

export type DeliveryHistoryItem =
  | {
      channel: 'email'
      id: string
      occurredAt: string
      email: EmailDeliveryLog
    }
  | {
      channel: 'webhook'
      id: string
      occurredAt: string
      webhook: WebhookDeliveryLog
    }

export function mergeDeliveryHistory(
  webhookDeliveries: WebhookDeliveryLog[],
  emailDeliveries: EmailDeliveryLog[],
): DeliveryHistoryItem[] {
  return [
    ...webhookDeliveries.map((webhook) => ({
      channel: 'webhook' as const,
      id: `webhook:${webhook.id}`,
      occurredAt: webhook.created_at,
      webhook,
    })),
    ...emailDeliveries.map((email) => ({
      channel: 'email' as const,
      id: `email:${email.id}`,
      occurredAt: email.occurred_at,
      email,
    })),
  ].sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
}

export function getEmailDeliveryPresentation(eventType: string) {
  switch (eventType) {
    case 'email.sent':
      return { label: 'Sent', tone: 'success' as const }
    case 'email.delivered':
      return { label: 'Delivered', tone: 'success' as const }
    case 'email.delivery_delayed':
      return { label: 'Delayed', tone: 'warning' as const }
    case 'email.bounced':
      return { label: 'Bounced', tone: 'danger' as const }
    case 'email.complained':
      return { label: 'Spam complaint', tone: 'danger' as const }
    case 'email.suppressed':
      return { label: 'Suppressed', tone: 'danger' as const }
    case 'email.failed':
      return { label: 'Failed', tone: 'danger' as const }
    default:
      return { label: 'Recorded', tone: 'neutral' as const }
  }
}
