import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('private ingestion paths opt out of public boards while board submissions opt in', () => {
  const widgetRoute = read('../../src/app/api/feedback/route.ts')
  const apiRoute = read('../../src/app/api/v1/feedback/route.ts')
  const boardRoute = read('../../src/app/api/boards/[slug]/submit/route.ts')
  const migration = read('../../../../sql/055_private_feedback_by_default.sql')

  assert.match(widgetRoute, /metadata: \{ source: 'widget' \}[\s\S]*is_public: false/)
  assert.match(apiRoute, /metadata: \{ \.\.\.metadata, source: 'api' \}[\s\S]*is_public: false/)
  assert.match(boardRoute, /metadata: \{ source: 'public_board' \}[\s\S]*is_public: true/)
  assert.match(migration, /alter column is_public set default false/i)
  assert.match(migration, /user_agent is distinct from 'public-board'/i)
})

test('private API keys are neither selected by the workspace nor persisted in browser storage', () => {
  const projectPage = read('../../src/app/(dashboard)/projects/[id]/page.tsx')
  const projectTabs = read('../../src/app/(dashboard)/projects/[id]/project-tabs.tsx')
  const projectKeys = read('../../src/lib/project-api-keys.ts')
  const newProject = read('../../src/app/(dashboard)/projects/new/page.tsx')

  assert.match(projectPage, /select\(SAFE_PROJECT_COLUMNS\)/)
  assert.doesNotMatch(projectPage, /select\(['"]\*['"]\)/)
  assert.doesNotMatch(projectTabs, /sessionStorage|rememberProjectApiKey|readStoredProjectApiKey/)
  assert.doesNotMatch(projectKeys, /sessionStorage|localStorage/)
  assert.match(newProject, /createPrivateKey: false/)
})

test('triage mutations use the latest version and conflict retries can reapply the intended change', () => {
  const actions = read('../../src/app/(dashboard)/feedback/[id]/feedback-actions.tsx')

  assert.match(actions, /feedbackVersionRef\.current/)
  assert.match(actions, /payload\?\.currentVersion/)
  assert.match(actions, /markError\(message, \(\) => handleStatusChange\(newStatus\)\)/)
  assert.match(actions, /markError\(message, \(\) => handlePriorityChange\(newPriority\)\)/)
})

test('new product update drafts move to their durable editor URL', () => {
  const updates = read('../../src/components/product-updates/ProductUpdatesTab.tsx')
  assert.match(updates, /window\.history\.replaceState\([\s\S]*`\/projects\/\$\{projectId\}\/release-notes\/\$\{data\.update\.id\}`/)
})

test('invalid profile, board, and widget values identify the field that needs attention', () => {
  const customize = read('../../src/app/(dashboard)/projects/[id]/customize-tab.tsx')
  const projectRoute = read('../../src/app/api/projects/[id]/route.ts')
  const settings = read('../../src/app/(dashboard)/settings/page.tsx')
  const boardRoute = read('../../src/app/api/projects/[id]/board/route.ts')
  const boardIdentity = read('../../src/components/board-settings/BoardIdentitySection.tsx')

  assert.match(customize, /aria-describedby=\{fieldErrors\.primaryColor/)
  assert.match(projectRoute, /fieldErrors: \{ primaryColor:/)
  assert.match(settings, /if \(!displayName\.trim\(\)\)/)
  assert.match(boardRoute, /fieldErrors: \{ display_name:/)
  assert.match(boardRoute, /fieldErrors: \{ websiteUrl:/)
  assert.match(boardIdentity, /board-website-url-error/)
})

test('framework installation includes package commands before component code', () => {
  const install = read('../../src/app/(dashboard)/projects/[id]/install-tab.tsx')
  const docs = read('../../src/lib/docs-content.ts')

  for (const packageName of ['@feedbacks/widget-react', '@feedbacks/widget-vue']) {
    assert.match(install, new RegExp(`pnpm add ${packageName.replace('/', '\\/')}`))
    assert.match(docs, new RegExp(`pnpm add ${packageName.replace('/', '\\/')}`))
  }
})
