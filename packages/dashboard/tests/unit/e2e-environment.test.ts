import assert from 'node:assert/strict'
import test from 'node:test'
import { getE2EEnvironmentSafety } from '../../src/lib/e2e-environment.ts'

const KEYS = [
  'E2E_ENVIRONMENT',
  'E2E_SUPABASE_PROJECT_REF',
  'E2E_EXPECTED_HOSTNAME',
  'E2E_AUTH_BYPASS_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'PLAYWRIGHT_BASE_URL',
] as const

function withEnvironment(values: Partial<Record<(typeof KEYS)[number], string>>, run: () => void) {
  const previous = new Map(KEYS.map((key) => [key, process.env[key]]))
  try {
    KEYS.forEach((key) => delete process.env[key])
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) process.env[key] = value
    })
    run()
  } finally {
    previous.forEach((value, key) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    })
  }
}

test('fails closed against the production Supabase project', () => {
  withEnvironment({
    E2E_ENVIRONMENT: 'true',
    E2E_SUPABASE_PROJECT_REF: 'xiiaugllydxxmjbtzfux',
    E2E_EXPECTED_HOSTNAME: '127.0.0.1',
    E2E_AUTH_BYPASS_SECRET: 'test-only',
    NEXT_PUBLIC_SUPABASE_URL: 'https://xiiaugllydxxmjbtzfux.supabase.co',
    PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3000',
  }, () => assert.match(getE2EEnvironmentSafety().reason, /Production Supabase/))
})

test('requires the expected hostname and project ref to match', () => {
  withEnvironment({
    E2E_ENVIRONMENT: 'true',
    E2E_SUPABASE_PROJECT_REF: 'safee2eref',
    E2E_EXPECTED_HOSTNAME: 'e2e.example.test',
    E2E_AUTH_BYPASS_SECRET: 'test-only',
    NEXT_PUBLIC_SUPABASE_URL: 'https://anotherref.supabase.co',
    PLAYWRIGHT_BASE_URL: 'https://wrong.example.test',
  }, () => assert.equal(getE2EEnvironmentSafety().safe, false))
})

test('accepts an explicitly matched non-production environment', () => {
  withEnvironment({
    E2E_ENVIRONMENT: 'true',
    E2E_SUPABASE_PROJECT_REF: 'safee2eref',
    E2E_EXPECTED_HOSTNAME: '127.0.0.1',
    E2E_AUTH_BYPASS_SECRET: 'test-only',
    NEXT_PUBLIC_SUPABASE_URL: 'https://safee2eref.supabase.co',
    PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3000',
  }, () => assert.deepEqual(getE2EEnvironmentSafety(), { safe: true, reason: '' }))
})
