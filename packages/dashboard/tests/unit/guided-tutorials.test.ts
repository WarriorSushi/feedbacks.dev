import assert from 'node:assert/strict'
import test from 'node:test'

async function loadTutorials() {
  return import(new URL('../../src/lib/guided-tutorials.ts', import.meta.url).href)
}

test('guided tutorials have unique ids and usable steps', async () => {
  const { GUIDED_TUTORIALS } = await loadTutorials()
  const tutorials = GUIDED_TUTORIALS as Array<{
    id: string
    steps: Array<{ href: string; target: string; title: string; body: string; tip?: string }>
  }>
  const ids = tutorials.map((tutorial) => tutorial.id)

  assert.equal(new Set(ids).size, ids.length)
  assert.ok(tutorials.length >= 7)
  for (const tutorial of tutorials) {
    assert.ok(tutorial.steps.length >= 3)
    for (const step of tutorial.steps) {
      assert.ok(step.href.startsWith('/'))
      assert.ok(step.target.startsWith('[data-tour='))
      assert.ok(step.title.length > 0)
      assert.ok(step.body.length > 0)
      if (step.tip) assert.ok(step.tip.length > 0)
    }
  }
})

test('required product onboarding teaches the complete product loop', async () => {
  const { getGuidedTutorial } = await loadTutorials()
  const onboarding = getGuidedTutorial('navigation')

  assert.ok(onboarding)
  assert.ok(onboarding.steps.length >= 16)

  const targets = new Set(onboarding.steps.map((step: { target: string }) => step.target))
  for (const target of [
    '[data-tour="project-switcher"]',
    '[data-tour="theme-switcher"]',
    '[data-tour="widget-placement"]',
    '[data-tour="widget-appearance"]',
    '[data-tour="widget-content"]',
    '[data-tour="widget-protection"]',
    '[data-tour="widget-preview"]',
    '[data-tour="install-platforms"]',
    '[data-tour="install-code"]',
    '[data-tour="inbox-filters"]',
    '[data-tour="inbox-list"]',
    '[data-tour="nav-updates"]',
    '[data-tour="nav-boards"]',
    '[data-tour="integration-endpoint"]',
    '[data-tour="dashboard-capabilities"]',
  ]) {
    assert.ok(targets.has(target), `missing onboarding target ${target}`)
  }
})

test('project tutorial routes resolve to the selected project', async () => {
  const { resolveTutorialHref } = await loadTutorials()
  assert.equal(
    resolveTutorialHref('/projects/{projectId}/install', 'project-123'),
    '/projects/project-123/install',
  )
})
