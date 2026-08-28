export type DodoPaymentsEnvironment = 'test' | 'live'
export type BillingMode = 'disabled' | DodoPaymentsEnvironment

export function normalizeDodoPaymentsEnvironment(value: string | null | undefined): DodoPaymentsEnvironment {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'live' || normalized === 'live_mode' ? 'live' : 'test'
}

export function resolveBillingMode({
  environment,
  apiKey,
  monthlyProductId,
  webhookSecret,
}: {
  environment: DodoPaymentsEnvironment
  apiKey: string | null
  monthlyProductId: string | null
  webhookSecret: string | null
}): BillingMode {
  if (!apiKey || !monthlyProductId || !webhookSecret) return 'disabled'
  return environment
}

export function isBillingCheckoutAvailable(mode: BillingMode) {
  return mode !== 'disabled'
}
