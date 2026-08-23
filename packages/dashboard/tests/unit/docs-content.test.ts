import assert from 'node:assert/strict'
import test from 'node:test'
import type { DocsPage } from '../../src/lib/docs-content.ts'
import { DOCS_MASCOT_BY_SLUG } from '../../src/lib/docs-mascots.ts'

async function loadDocsContent() {
  return import(new URL('../../src/lib/docs-content.ts', import.meta.url).href)
}

test('documentation has unique routes and useful article structure', async () => {
  const { DOCS_PAGES } = await loadDocsContent()
  const pages = DOCS_PAGES as DocsPage[]
  const slugs = pages.map((page) => page.slug)

  assert.equal(pages.length, 17)
  assert.ok(slugs.includes('install/product-updates'))
  assert.equal(new Set(slugs).size, slugs.length)
  for (const page of pages) {
    assert.ok(page.title.length > 2)
    assert.ok(page.description.length > 20)
    assert.ok(page.blocks.some((block) => block.type === 'heading'))
  }
})

test('every documentation article has a contextual mascot assignment', async () => {
  const { DOCS_PAGES } = await loadDocsContent()
  const pages = DOCS_PAGES as DocsPage[]

  for (const page of pages) {
    assert.ok(DOCS_MASCOT_BY_SLUG[page.slug as keyof typeof DOCS_MASCOT_BY_SLUG], `missing mascot for ${page.slug}`)
  }
  assert.ok(new Set(Object.values(DOCS_MASCOT_BY_SLUG)).size >= 10)
})

test('documentation heading anchors are unique within each page', async () => {
  const { DOCS_PAGES } = await loadDocsContent()
  const pages = DOCS_PAGES as DocsPage[]

  for (const page of pages) {
    const ids = page.blocks.flatMap((block) => block.type === 'heading' ? [block.id] : [])
    assert.equal(new Set(ids).size, ids.length, `duplicate heading id on ${page.slug}`)
  }
})
