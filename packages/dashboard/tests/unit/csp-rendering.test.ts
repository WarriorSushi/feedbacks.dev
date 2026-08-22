import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('nonce CSP uses request-aware rendering so Next can hydrate every route', () => {
  const middleware = read('../../src/middleware.ts')
  const layout = read('../../src/app/layout.tsx')

  assert.match(middleware, /'nonce-\$\{nonce\}' 'strict-dynamic'/)
  assert.match(middleware, /requestHeaders\.set\('Content-Security-Policy'/)
  assert.match(layout, /import \{ headers \} from 'next\/headers'/)
  assert.match(layout, /export default async function RootLayout/)
  assert.match(layout, /\(await headers\(\)\)\.get\('x-nonce'\)/)
  assert.match(layout, /nonce=\{nonce\}/)
  assert.match(layout, /nonce=\{nonce\}[\s\S]*suppressHydrationWarning/)
})

test('auth bot protection supports hCaptcha first and Turnstile as a fallback', () => {
  const middleware = read('../../src/middleware.ts')
  const auth = read('../../src/app/auth/page.tsx')
  const captcha = read('../../src/components/auth-captcha.tsx')

  assert.match(middleware, /NEXT_PUBLIC_HCAPTCHA_SITE_KEY/)
  assert.match(middleware, /https:\/\/\*\.hcaptcha\.com/)
  assert.match(middleware, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/)
  assert.match(middleware, /https:\/\/challenges\.cloudflare\.com/)
  assert.match(auth, /hcaptchaSiteKey \? 'hcaptcha'/)
  assert.match(auth, /captchaToken: captchaToken \|\| undefined/)
  assert.match(auth, /AuthCaptcha/)
  assert.match(captcha, /https:\/\/js\.hcaptcha\.com/)
  assert.match(captcha, /onReady=\{renderWidget\}/)
  assert.doesNotMatch(auth, /HCAPTCHA_SECRET_KEY|TURNSTILE_SECRET_KEY/)
})
