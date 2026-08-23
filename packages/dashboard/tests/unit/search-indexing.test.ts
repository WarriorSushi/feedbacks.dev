import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')

test('every static legal sitemap page declares its own canonical URL', async () => {
  const [privacy, terms] = await Promise.all([
    read('../../src/app/privacy/page.tsx'),
    read('../../src/app/terms/page.tsx'),
  ])

  assert.match(privacy, /alternates: \{ canonical: '\/privacy' \}/)
  assert.match(terms, /alternates: \{ canonical: '\/terms' \}/)
})

test('canonical host and legacy route redirects are permanent', async () => {
  const middleware = await read('../../src/middleware.ts')

  assert.match(middleware, /NextResponse\.redirect\(earlyCanonicalRedirect, 308\)/)
  assert.match(middleware, /NextResponse\.redirect\(new URL\(legacyProjectTabRedirect, request\.url\), 308\)/)
  assert.match(middleware, /isSessionDependentAppRoot \? 307 : 308/)
})
