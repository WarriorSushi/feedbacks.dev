import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeCustomBoardCss } from '../../src/lib/board-custom-css.ts'

test('scopes custom board CSS to the public board root', () => {
  assert.equal(
    sanitizeCustomBoardCss('.request-card { color: red; }'),
    '[data-public-board] .request-card { color: red; }',
  )
})

test('maps global selectors to the board root', () => {
  assert.equal(
    sanitizeCustomBoardCss('body { --board-accent: #3355ff; }'),
    '[data-public-board] { --board-accent: #3355ff; }',
  )
})

test('rejects external resources and page-covering declarations', () => {
  assert.throws(
    () => sanitizeCustomBoardCss('.x { background: url(https://tracking.invalid/pixel); }'),
    /external resources/i,
  )
  assert.throws(
    () => sanitizeCustomBoardCss('.x { position: fixed; }'),
    /position: fixed/i,
  )
  assert.throws(
    () => sanitizeCustomBoardCss('@import "https://tracking.invalid";'),
    /external resources/i,
  )
})
