import assert from 'node:assert/strict'
import test from 'node:test'
import {
  editConflictResponse,
  formatVersionEtag,
  mutationVersionHeaders,
  parseIfMatchVersion,
  parseMutationVersion,
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

test('application mutation versions use a namespaced header and keep legacy ETag compatibility', () => {
  const version = '2026-08-02T02:30:00.000Z'
  const applicationHeaders = new Headers(mutationVersionHeaders(version))
  assert.equal(applicationHeaders.get('x-feedbacks-version'), version)
  assert.equal(parseMutationVersion(applicationHeaders), version)

  const legacyHeaders = new Headers({ 'If-Match': formatVersionEtag(version) })
  assert.equal(parseMutationVersion(legacyHeaders), version)
})

test('edit conflicts preserve a safe recovery instruction and current version', () => {
  assert.deepEqual(editConflictResponse('new-version'), {
    code: 'EDIT_CONFLICT',
    error: 'A newer saved version is available. Your text is still in the editor. Use Reload saved version to load it, review your changes, then save again.',
    currentVersion: 'new-version',
  })
})
