import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_AUTH_REDIRECT, resolveAuthRedirect } from '../../src/lib/auth-destination.ts'

test('ordinary sign-in returns existing users to the dashboard', () => {
  assert.equal(DEFAULT_AUTH_REDIRECT, '/dashboard')
  assert.equal(resolveAuthRedirect(null), '/dashboard')
  assert.equal(resolveAuthRedirect('/billing?intent=pro'), '/billing?intent=pro')
  assert.equal(resolveAuthRedirect('https://example.com'), '/dashboard')
})
