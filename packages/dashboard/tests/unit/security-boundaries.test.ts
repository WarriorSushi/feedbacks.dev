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
    '../../src/app/api/projects/[id]/updates/[updateId]/visibility/route.ts',
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
    '../../src/app/api/projects/[id]/updates/[updateId]/visibility/route.ts',
    '../../src/app/api/projects/[id]/updates/settings/route.ts',
  ]
  for (const route of routes) {
    const source = read(route)
    assert.match(source, /parseMutationVersion/, route)
    assert.match(source, /(PRECONDITION_REQUIRED|status:\s*428)/, route)
    assert.match(source, /(editConflictResponse|status:\s*409)/, route)
  }
})

test('browser mutations use the application version header instead of transport If-Match', () => {
  const clients = [
    '../../src/components/product-updates/ProductUpdatesTab.tsx',
    '../../src/app/(dashboard)/feedback/[id]/feedback-actions.tsx',
    '../../src/app/(dashboard)/projects/[id]/customize-tab.tsx',
    '../../src/app/(dashboard)/projects/[id]/project-tabs.tsx',
  ]
  for (const client of clients) {
    const source = read(client)
    assert.match(source, /mutationVersionHeaders|MUTATION_VERSION_HEADER/, client)
    assert.doesNotMatch(source, /['"]If-Match['"]/, client)
  }
})

test('public feedback notes inherit feedback and board visibility', () => {
  const migration = read('../../../../sql/062_constrain_public_feedback_note_visibility.sql')
  assert.match(migration, /feedback_notes\.is_public = true/i)
  assert.match(migration, /f\.is_public = true/i)
  assert.match(migration, /f\.is_archived = false/i)
  assert.match(migration, /board\.enabled = true/i)
  assert.match(migration, /board\.visibility <> 'private'/i)
  assert.match(migration, /p\.owner_user_id = \(select auth\.uid\(\)\)/i)
})
