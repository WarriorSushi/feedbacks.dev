import assert from 'node:assert/strict'
import test from 'node:test'
import { readErrorMessage, readFieldErrors } from '../../src/lib/form-errors.ts'

test('normalizes API field errors without exposing invalid payload values', () => {
  assert.deepEqual(readFieldErrors({
    fieldErrors: {
      name: ['Project name is required.'],
      domain: 'Enter a valid domain.',
      empty: [],
      unsafe: { message: 'not accepted' },
    },
  }), {
    name: 'Project name is required.',
    domain: 'Enter a valid domain.',
  })
})

test('uses actionable API messages and safe fallbacks', () => {
  assert.equal(readErrorMessage({ error: 'Check the highlighted field.' }, 'Fallback'), 'Check the highlighted field.')
  assert.equal(readErrorMessage({ error: { private: 'details' } }, 'Try again.'), 'Try again.')
})
