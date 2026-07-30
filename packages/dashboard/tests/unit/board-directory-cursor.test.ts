import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeBoardDirectoryCursor,
  encodeBoardDirectoryCursor,
} from '../../src/lib/board-directory-cursor.ts'

const cursor = {
  score: 42.5,
  activityAt: '2026-07-29T12:00:00.000Z',
  snapshotAt: '2026-07-30T12:00:00.000Z',
  id: '51e80367-9ac2-46d0-8f27-431a09464190',
}

test('board directory cursors preserve a stable ranking snapshot', () => {
  assert.deepEqual(decodeBoardDirectoryCursor(encodeBoardDirectoryCursor(cursor)), cursor)
})

test('board directory cursors reject malformed score, dates, and IDs', () => {
  assert.equal(decodeBoardDirectoryCursor('bad'), null)
  assert.equal(
    decodeBoardDirectoryCursor(
      Buffer.from(JSON.stringify({ ...cursor, score: '42' })).toString('base64url'),
    ),
    null,
  )
  assert.equal(
    decodeBoardDirectoryCursor(
      Buffer.from(JSON.stringify({ ...cursor, id: 'not-a-uuid' })).toString('base64url'),
    ),
    null,
  )
})
