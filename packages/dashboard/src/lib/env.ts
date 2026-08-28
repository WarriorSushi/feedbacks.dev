import {
  normalizeDodoPaymentsEnvironment,
  resolveBillingMode,
} from './billing-mode.ts'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env.local file or deployment settings.`
    )
  }
  return value
}

function optionalEnv(name: string): string | null {
  const value = process.env[name]
  if (!value) return null
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  NEXT_PUBLIC_APP_ORIGIN: requireEnv('NEXT_PUBLIC_APP_ORIGIN'),
  DODO_PAYMENTS_API_KEY: optionalEnv('DODO_PAYMENTS_API_KEY'),
  DODO_PAYMENTS_ENVIRONMENT: normalizeDodoPaymentsEnvironment(process.env.DODO_PAYMENTS_ENVIRONMENT),
  DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID: optionalEnv('DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID'),
  DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID: optionalEnv('DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID'),
  DODO_PAYMENTS_WEBHOOK_SECRET: optionalEnv('DODO_PAYMENTS_WEBHOOK_SECRET'),
  AGENT_SETUP_TOKEN_SECRET: optionalEnv('AGENT_SETUP_TOKEN_SECRET'),
  RESEND_API_KEY: optionalEnv('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: optionalEnv('RESEND_FROM_EMAIL'),
  RESEND_WEBHOOK_SECRET: optionalEnv('RESEND_WEBHOOK_SECRET'),
  META_CAPI_ACCESS_TOKEN: optionalEnv('META_CAPI_ACCESS_TOKEN'),
  META_CAPI_API_VERSION: optionalEnv('META_CAPI_API_VERSION') || 'v23.0',
  META_CAPI_TEST_EVENT_CODE: optionalEnv('META_CAPI_TEST_EVENT_CODE'),
  REDDIT_CAPI_ACCESS_TOKEN: optionalEnv('REDDIT_CAPI_ACCESS_TOKEN'),
  MARKETING_COOKIE_SECRET: optionalEnv('MARKETING_COOKIE_SECRET'),
} as const

export function isBillingEnabled() {
  return getBillingMode() !== 'disabled'
}

export function getBillingMode() {
  return resolveBillingMode({
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    apiKey: env.DODO_PAYMENTS_API_KEY,
    monthlyProductId: env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID,
    webhookSecret: env.DODO_PAYMENTS_WEBHOOK_SECRET,
  })
}

export function isEmailEnabled() {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)
}
