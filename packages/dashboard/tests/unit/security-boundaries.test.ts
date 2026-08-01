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
  const widgetInstall = read('../../../shared/src/widget-install.ts')
  assert.match(route, /allowedTopLevel/)
  assert.match(route, /allowedSettings/)
  assert.match(route, /\{ \.\.\.\(project\.settings \|\| \{\}\) \}/)
  assert.doesNotMatch(route, /updates\.settings = body\.settings/)
  assert.match(route, /mergeOwnerEditableWidgetConfig/)
  assert.match(widgetInstall, /'feedbackEnabled', 'enableUpdates'/)
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

test('owner-editable project, feedback, and Product Update routes require version preconditions', () => {
  const routes = [
    '../../src/app/api/projects/[id]/route.ts',
    '../../src/app/api/feedback/[id]/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/publish/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/archive/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/restore/route.ts',
    '../../src/app/api/projects/[id]/updates/[updateId]/image/route.ts',
    '../../src/app/api/projects/[id]/updates/settings/route.ts',
  ]
  for (const route of routes) {
    const source = read(route)
    assert.match(source, /parseIfMatchVersion/, route)
    assert.match(source, /(PRECONDITION_REQUIRED|status:\s*428)/, route)
    assert.match(source, /(editConflictResponse|status:\s*409)/, route)
  }
})
