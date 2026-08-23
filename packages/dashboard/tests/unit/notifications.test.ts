import test from 'node:test'
import assert from 'node:assert/strict'

async function loadNotifications() {
  return import(new URL('../../src/lib/notification-html.ts', import.meta.url).href)
}

async function loadPublicBoardNotifications() {
  return import(new URL('../../src/lib/public-board-notifications.ts', import.meta.url).href)
}

test('email HTML escaping covers common injection characters', async () => {
  const { escapeEmailHtml } = await loadNotifications()

  assert.equal(
    escapeEmailHtml(`<script>alert("xss")</script> & 'quoted'`),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;',
  )
})

test('email HTML escaping handles nullish values', async () => {
  const { escapeEmailHtml } = await loadNotifications()

  assert.equal(escapeEmailHtml(null), '')
  assert.equal(escapeEmailHtml(undefined), '')
})

test('branded email shell provides a consistent client-safe frame', async () => {
  const { renderBrandedEmail } = await loadNotifications()
  const html = renderBrandedEmail({
    subject: '[feedbacks.dev] New feedback <script>',
    contentHtml: '<h2>New feedback</h2><p>Useful signal.</p>',
    appOrigin: 'https://app.feedbacks.dev',
  })

  assert.match(html, /^<!doctype html>/)
  assert.match(html, /new_logo_feedbacks\.dev\.png/)
  assert.match(html, /Product signal, without the clutter\./)
  assert.match(html, /Manage notification settings/)
  assert.match(html, /<h2>New feedback<\/h2>/)
  assert.doesNotMatch(html, /<title>.*<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('every Resend email is wrapped by the shared brand renderer', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(
    new URL('../../src/lib/notifications.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /html: renderBrandedEmail\(/)
  assert.equal((source.match(/api\.resend\.com\/emails/g) || []).length, 1)
})

test('optional email alert paths enforce the Pro entitlement on the server', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(
    new URL('../../src/lib/notifications.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /canUserReceiveEmailAlerts\(project\.owner_user_id\)/)
  assert.match(source, /canUserReceiveEmailAlerts\(userId\)/)
  assert.match(source, /if \(!await canUserReceiveEmailAlerts\(userId\)\) return null/)
  assert.ok(
    (source.match(/canUserReceiveEmailAlerts\(/g) || []).length >= 4,
    'expected every optional alert fanout to check the Pro entitlement',
  )
})

test('public board notification recipients are deduped and exclude the actor', async () => {
  const { mergePublicBoardSubscriberIds } = await loadPublicBoardNotifications()

  assert.deepEqual(
    mergePublicBoardSubscriberIds({
      followUserIds: ['owner', 'watcher-a', 'watcher-b'],
      watchUserIds: ['watcher-a', 'watcher-c'],
      excludeUserId: 'owner',
    }),
    ['watcher-a', 'watcher-b', 'watcher-c'],
  )
})

test('public board status email escapes request content', async () => {
  const { buildPublicBoardStatusEmail } = await loadPublicBoardNotifications()

  const email = buildPublicBoardStatusEmail({
    appOrigin: 'https://app.feedbacks.dev',
    board: { id: 'board-1', slug: 'roadmap', display_name: 'Roadmap <Beta>' },
    feedback: { id: 'feedback-1', message: '<script>alert("x")</script>' },
    oldStatus: 'planned',
    newStatus: 'in_progress',
  })

  assert.match(email.subject, /request moved to in progress/)
  assert.match(email.text, /planned -> in_progress/)
  assert.match(email.html, /Roadmap &lt;Beta&gt;/)
  assert.match(email.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
  assert.match(email.html, /https:\/\/app.feedbacks.dev\/p\/roadmap#feedback-1/)
})

test('public board reply email escapes team reply content', async () => {
  const { buildPublicBoardReplyEmail } = await loadPublicBoardNotifications()

  const email = buildPublicBoardReplyEmail({
    appOrigin: 'https://app.feedbacks.dev',
    board: { id: 'board-1', slug: 'roadmap', title: 'Roadmap' },
    feedback: { id: 'feedback-1', message: 'Add export' },
    replyContent: 'Shipped <strong>today</strong>',
  })

  assert.match(email.subject, /team reply/)
  assert.match(email.html, /Shipped &lt;strong&gt;today&lt;\/strong&gt;/)
})
