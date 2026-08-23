import assert from 'node:assert/strict'
import test from 'node:test'

async function loadDeliveryHistory() {
  return import(new URL('../../src/lib/delivery-history.ts', import.meta.url).href)
}

test('delivery history merges email and webhook activity newest first', async () => {
  const { mergeDeliveryHistory } = await loadDeliveryHistory()
  const history = mergeDeliveryHistory(
    [
      {
        id: 'webhook-1',
        event: 'feedback.created',
        kind: 'generic',
        url: 'https://example.com/hook',
        status: 'success',
        status_code: 200,
        response_body: null,
        attempt: 1,
        payload: null,
        created_at: '2026-08-24T10:00:00.000Z',
      },
    ],
    [
      {
        id: 'email-1',
        event_type: 'email.sent',
        provider_email_id: 'provider-1',
        reason: null,
        occurred_at: '2026-08-24T10:01:00.000Z',
      },
    ],
  )

  assert.deepEqual(history.map((item: { channel: string }) => item.channel), ['email', 'webhook'])
  assert.deepEqual(history.map((item: { id: string }) => item.id), ['email:email-1', 'webhook:webhook-1'])
})

test('email delivery events map to clear operational states', async () => {
  const { getEmailDeliveryPresentation } = await loadDeliveryHistory()

  assert.deepEqual(getEmailDeliveryPresentation('email.delivered'), { label: 'Delivered', tone: 'success' })
  assert.deepEqual(getEmailDeliveryPresentation('email.delivery_delayed'), { label: 'Delayed', tone: 'warning' })
  assert.deepEqual(getEmailDeliveryPresentation('email.bounced'), { label: 'Bounced', tone: 'danger' })
  assert.deepEqual(getEmailDeliveryPresentation('unexpected.event'), { label: 'Recorded', tone: 'neutral' })
})
