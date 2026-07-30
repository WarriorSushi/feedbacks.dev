import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeFeedbackPageUrl } from '../../../widget/src/privacy.ts'

test('automatic widget context keeps origin and path but drops query and fragment', () => {
  assert.equal(
    sanitizeFeedbackPageUrl('https://app.example.com/account/reset?token=secret#customer'),
    'https://app.example.com/account/reset',
  )
})

test('automatic widget context rejects non-web and malformed URLs', () => {
  assert.equal(sanitizeFeedbackPageUrl('javascript:alert(1)'), '')
  assert.equal(sanitizeFeedbackPageUrl('not a url'), '')
})
