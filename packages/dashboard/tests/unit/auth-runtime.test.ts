import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('the server-only Supabase admin client never persists a user session', () => {
  const source = read('../../src/lib/supabase-server.ts')

  assert.match(source, /autoRefreshToken: false/)
  assert.match(source, /detectSessionInUrl: false/)
  assert.match(source, /persistSession: false/)
})

test('repository runtimes satisfy the current Supabase Node requirement', () => {
  const packageJson = JSON.parse(read('../../../../package.json')) as { engines?: { node?: string } }
  const workflow = read('../../../../.github/workflows/ci.yml')

  assert.equal(packageJson.engines?.node, '>=22.0.0')
  assert.doesNotMatch(workflow, /node-version: 20/)
})
