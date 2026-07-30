import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('owner project resolution does not select private credential hashes', () => {
  const auth = read('../../src/lib/api-auth.ts')
  assert.doesNotMatch(auth, /\.from\('projects'\)\s*\.select\('\*'\)/)
  assert.doesNotMatch(auth.match(/getAuthedUserAndProject[\s\S]+$/)?.[0] || '', /api_key_hash/)
})

test('generic project mutation rejects unknown property bags and merges settings server-side', () => {
  const route = read('../../src/app/api/projects/[id]/route.ts')
  assert.match(route, /allowedTopLevel/)
  assert.match(route, /allowedSettings/)
  assert.match(route, /\{ \.\.\.\(project\.settings \|\| \{\}\) \}/)
  assert.doesNotMatch(route, /updates\.settings = body\.settings/)
})

test('all API route bodies use bounded readers instead of request.json', () => {
  const routes = [
    '../../src/app/api/account/delete/route.ts',
    '../../src/app/api/billing/checkout/route.ts',
    '../../src/app/api/projects/[id]/updates/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/route.ts',
    '../../src/app/api/projects/[id]/updates/settings/route.ts',
    '../../src/app/api/projects/[id]/modules/route.ts',
    '../../src/app/api/projects/[id]/activation/route.ts',
  ]
  for (const route of routes) {
    assert.doesNotMatch(read(route), /request\.json\(\)/, route)
  }
})
