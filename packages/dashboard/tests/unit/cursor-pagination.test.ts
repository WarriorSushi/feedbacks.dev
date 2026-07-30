import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeFeedbackCursor,
  encodeFeedbackCursor,
  feedbackCursorFilter,
  nextFeedbackCursor,
} from '../../src/lib/cursor-pagination.ts'

const row = {
  created_at: '2026-07-30T17:00:58.123Z',
  id: '51e80367-9ac2-46d0-8f27-431a09464190',
}

test('feedback cursors are opaque, stable, and validated', () => {
  const encoded = encodeFeedbackCursor({ createdAt: row.created_at, id: row.id })
  assert.deepEqual(decodeFeedbackCursor(encoded), {
    createdAt: row.created_at,
    id: row.id,
  })
  assert.equal(decodeFeedbackCursor('not-a-cursor'), null)
  assert.equal(decodeFeedbackCursor(Buffer.from(JSON.stringify({ createdAt: row.created_at, id: 'bad' })).toString('base64url')), null)
})

test('cursor filters preserve descending timestamp and UUID tie-break ordering', () => {
  assert.equal(
    feedbackCursorFilter({ createdAt: row.created_at, id: row.id }),
    `created_at.lt."${row.created_at}",and(created_at.eq."${row.created_at}",id.lt.${row.id})`,
  )
})

test('next cursor exists only when another page exists', () => {
  assert.equal(nextFeedbackCursor([row], false), null)
  assert.deepEqual(decodeFeedbackCursor(nextFeedbackCursor([row], true)), {
    createdAt: row.created_at,
    id: row.id,
  })
})
