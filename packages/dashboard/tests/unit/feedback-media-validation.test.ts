import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import {
  normalizeFeedbackFilename,
  validateAndSanitizeFeedbackImage,
} from '../../src/lib/feedback-media-validation.ts'

test('normalizes path-like and unicode filenames to a safe image filename', () => {
  assert.equal(normalizeFeedbackFilename('../../résumé<script>.pdf', 'image/png'), 'r-sum--script-.png')
})

test('rejects declared image MIME when magic bytes do not match', async () => {
  await assert.rejects(
    validateAndSanitizeFeedbackImage({
      buffer: Buffer.from('%PDF-1.7'),
      claimedMimeType: 'image/png',
      originalFilename: 'fake.png',
      maxBytes: 1024,
    }),
    /contents do not match/i,
  )
})

test('re-encodes a valid image and returns an integrity hash', async () => {
  const source = await sharp({
    create: {
      width: 3,
      height: 2,
      channels: 4,
      background: { r: 30, g: 100, b: 180, alpha: 1 },
    },
  }).png().withMetadata({ orientation: 6 }).toBuffer()

  const result = await validateAndSanitizeFeedbackImage({
    buffer: source,
    claimedMimeType: 'image/png',
    originalFilename: 'capture.png',
    maxBytes: 1024 * 1024,
  })

  assert.equal(result.mimeType, 'image/png')
  assert.equal(result.sha256.length, 64)
  assert.equal(result.safeFilename, 'capture.png')
  const metadata = await sharp(result.buffer).metadata()
  assert.equal(metadata.orientation, undefined)
})
