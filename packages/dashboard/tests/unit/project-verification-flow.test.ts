import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('real product verification polls only authenticated project feedback after the session starts', () => {
  const route = read('../../src/app/api/projects/[id]/verification-status/route.ts')
  const client = read('../../src/app/(dashboard)/projects/[id]/project-verify-client.tsx')

  assert.match(route, /getAuthedUserAndProject\(id\)/)
  assert.match(route, /\.eq\('project_id', id\)/)
  assert.match(route, /\.gte\('created_at', boundedSince\)/)
  assert.match(route, /\.select\('id, created_at, url'\)/)
  assert.match(route, /\.not\('url', 'ilike', `%\/projects\/\$\{id\}\/verify%`\)/)
  assert.doesNotMatch(route, /message/)
  assert.match(client, /verification-status\?since=/)
  assert.match(client, /setInterval\(\(\) => void checkForProductFeedback\(\), 4000\)/)
  assert.match(client, /Test feedback arrived from your product/)
})

test('first connection guides users from installation through customization', () => {
  const progress = read('../../src/app/(dashboard)/projects/[id]/project-flow-nav.tsx')
  const verify = read('../../src/app/(dashboard)/projects/[id]/project-verify-client.tsx')

  for (const label of ['Install', 'Test', 'Inbox', 'Customize']) {
    assert.match(progress, new RegExp(`label: '${label}'`))
  }
  assert.match(verify, /Customize feedback form/)
  assert.match(verify, /Troubleshooting: test the saved form here/)
  assert.match(verify, /fixed to the \$\{launcherPosition\} of this page/)
})
