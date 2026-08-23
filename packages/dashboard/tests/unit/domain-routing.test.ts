import assert from 'node:assert/strict'
import test from 'node:test'

async function loadDomainRouting() {
  return import(new URL('../../src/lib/domain-routing.ts', import.meta.url).href)
}

test('dashboard surfaces redirect from marketing host to app host', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()

  const redirect = getCanonicalHostRedirect(new URL('https://www.feedbacks.dev/dashboard?hello=1'))

  assert.equal(redirect?.toString(), 'https://app.feedbacks.dev/dashboard?hello=1')
})

test('auth surfaces redirect from apex host to app host', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()

  const redirect = getCanonicalHostRedirect(new URL('https://feedbacks.dev/auth?redirect=%2Fprojects'))

  assert.equal(redirect?.toString(), 'https://app.feedbacks.dev/auth?redirect=%2Fprojects')
})

test('marketing surfaces redirect from app host to www host', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()

  const cases = [
    ['/boards?sort=recent', '/boards?sort=recent'],
    ['/feedback-widget', '/feedback-widget'],
    ['/feedback-widget/nextjs', '/feedback-widget/nextjs'],
    ['/canny-alternative', '/canny-alternative'],
    ['/p/customer-board', '/p/customer-board'],
  ]

  for (const [input, expected] of cases) {
    const redirect = getCanonicalHostRedirect(new URL(`https://app.feedbacks.dev${input}`))
    assert.equal(redirect?.toString(), `https://www.feedbacks.dev${expected}`)
  }
})

test('lead and invite links stay on the marketing host', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()
  assert.equal(
    getCanonicalHostRedirect(new URL('https://app.feedbacks.dev/early-access?utm_source=reddit'))?.toString(),
    'https://www.feedbacks.dev/early-access?utm_source=reddit',
  )
  assert.equal(
    getCanonicalHostRedirect(new URL('https://app.feedbacks.dev/r/abcdefghij'))?.toString(),
    'https://www.feedbacks.dev/r/abcdefghij',
  )
})

test('documentation stays on the canonical marketing host', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()
  const redirect = getCanonicalHostRedirect(new URL('https://app.feedbacks.dev/docs/api/rest'))

  assert.equal(redirect?.toString(), 'https://www.feedbacks.dev/docs/api/rest')
})

test('app root sends anonymous users to auth and signed-in users to dashboard', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()

  assert.equal(
    getCanonicalHostRedirect(new URL('https://app.feedbacks.dev/'), false)?.toString(),
    'https://app.feedbacks.dev/auth',
  )
  assert.equal(
    getCanonicalHostRedirect(new URL('https://app.feedbacks.dev/'), true)?.toString(),
    'https://app.feedbacks.dev/dashboard',
  )
})

test('preview deployments are left alone', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()

  const redirect = getCanonicalHostRedirect(
    new URL('https://feedbacks-dev-dashboard-preview.vercel.app/dashboard'),
  )

  assert.equal(redirect, null)
})

test('localhost surfaces are left alone even when local origins are configured', async () => {
  const { getCanonicalHostRedirect } = await loadDomainRouting()
  assert.equal(getCanonicalHostRedirect(new URL('http://localhost:3000/boards')), null)
  assert.equal(getCanonicalHostRedirect(new URL('http://127.0.0.1:3000/dashboard')), null)
})
