import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('widget loads the first-party screenshot renderer on demand without a third-party CDN', async () => {
  const widgetUrl = new URL('../../../widget/src/widget.ts', import.meta.url)
  const source = await readFile(widgetUrl, 'utf8')

  assert.match(source, /new URL\('\/widget\/capture\.mjs'/)
  assert.match(source, /import\(rendererUrl\)/)
  assert.doesNotMatch(source, /html2canvas|cdn\.jsdelivr\.net/)
})

test('capture renderer supports modern CSS and captures only the visible viewport', async () => {
  const rendererUrl = new URL('../../../widget/src/capture-renderer.ts', import.meta.url)
  const renderer = await readFile(rendererUrl, 'utf8')
  const widgetUrl = new URL('../../../widget/src/widget.ts', import.meta.url)
  const source = await readFile(widgetUrl, 'utf8')

  assert.match(renderer, /from '@zumer\/snapdom'/)
  assert.match(renderer, /clip: 'viewport'/)
  assert.match(renderer, /data-feedbacks-capture-exclude/)
  assert.match(source, /toDataURL\('image\/jpeg'/)
  assert.match(source, /SCREENSHOT_CAPTURE_TIMEOUT_MS = 12_000/)
  assert.match(source, /Choose image/)
  assert.match(source, /feedbacks:screenshot-error/)
  assert.match(source, /screenshotCaptureErrorCode/)
  assert.match(source, /this\.screenshotDiagnostic = detail/)
  assert.match(source, /dataUrlToBlob/)
  assert.match(source, /width \* height > 40_000_000/)
})

test('capture failures are safely recorded and mutable widget assets are always revalidated', async () => {
  const routeUrl = new URL('../../src/app/api/feedback/route.ts', import.meta.url)
  const route = await readFile(routeUrl, 'utf8')
  const nextConfigUrl = new URL('../../next.config.js', import.meta.url)
  const nextConfig = await readFile(nextConfigUrl, 'utf8')

  assert.match(route, /SCREENSHOT_CAPTURE_ERROR_CODES/)
  assert.match(route, /screenshot_capture: screenshotCaptureDiagnostic/)
  assert.match(route, /slice\(0, 240\)/)
  assert.match(nextConfig, /public, max-age=0, s-maxage=0, must-revalidate/)
  assert.doesNotMatch(nextConfig, /stale-while-revalidate=86400/)
})

test('required screenshots are enforced before feedback submission', async () => {
  const widgetUrl = new URL('../../../widget/src/widget.ts', import.meta.url)
  const source = await readFile(widgetUrl, 'utf8')

  assert.match(source, /this\.cfg\.screenshotRequired && !this\.screenshotData/)
  assert.match(source, /capture the page or choose an image before sending/)
  assert.match(source, /draftStorage\?\.removeItem\(draftKey\);\s+this\.screenshotData = null;/)
})
