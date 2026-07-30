import assert from 'node:assert/strict'
import test from 'node:test'
import {
  editConflictResponse,
  formatVersionEtag,
  parseIfMatchVersion,
} from '../../src/lib/optimistic-concurrency.ts'

test('project versions round-trip through a strong ETag', () => {
  const version = '2026-07-30T17:00:58.123Z'
  assert.equal(parseIfMatchVersion(formatVersionEtag(version)), version)
})

test('malformed or wildcard If-Match values are rejected', () => {
  assert.equal(parseIfMatchVersion(null), null)
  assert.equal(parseIfMatchVersion('*'), null)
  assert.equal(parseIfMatchVersion('weak-version'), null)
  assert.equal(parseIfMatchVersion('W/"version"'), null)
})

test('edit conflicts preserve a safe recovery instruction and current version', () => {
  assert.deepEqual(editConflictResponse('new-version'), {
    code: 'EDIT_CONFLICT',
    error: 'This content changed in another tab. Your draft is still available—reload the latest version, review it, and save again.',
    currentVersion: 'new-version',
  })
})
