import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { GitHubEndpoint, WebhookConfig, WebhookEndpoint } from '@/lib/types'
import type { WebhookKind } from '@/lib/webhook-config'
import { normalizeWebhookConfig } from '@/lib/webhook-config'

const ALGORITHM = 'aes-256-gcm'
const KEY_VERSION = 1

export interface IntegrationSecretPayload {
  url?: string
  token?: string
  signingSecret?: string
}

interface StoredIntegrationSecret {
  endpoint_id: string
  kind: WebhookKind
  ciphertext: string
  initialization_vector: string
  auth_tag: string
  key_version: number
  destination_hint: string
}

function getEncryptionKey(): Buffer {
  const encoded = process.env.INTEGRATION_SECRET_ENCRYPTION_KEY?.trim()
  if (!encoded) {
    throw new Error('INTEGRATION_SECRET_ENCRYPTION_KEY is not configured')
  }

  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) {
    throw new Error('INTEGRATION_SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  }
  return key
}

function encode(value: Buffer): string {
  return value.toString('base64')
}

function decode(value: string): Buffer {
  return Buffer.from(value, 'base64')
}

function encryptSecret(payload: IntegrationSecretPayload) {
  const initializationVector = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), initializationVector)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])

  return {
    ciphertext: encode(ciphertext),
    initialization_vector: encode(initializationVector),
    auth_tag: encode(cipher.getAuthTag()),
    key_version: KEY_VERSION,
  }
}

function decryptSecret(record: StoredIntegrationSecret): IntegrationSecretPayload {
  if (record.key_version !== KEY_VERSION) {
    throw new Error(`Unsupported integration secret key version: ${record.key_version}`)
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    decode(record.initialization_vector),
  )
  decipher.setAuthTag(decode(record.auth_tag))
  const plaintext = Buffer.concat([
    decipher.update(decode(record.ciphertext)),
    decipher.final(),
  ]).toString('utf8')

  const parsed = JSON.parse(plaintext) as IntegrationSecretPayload
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Integration secret payload is invalid')
  }
  return parsed
}

function safeHostname(value?: string): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function integrationDestinationHint(
  kind: WebhookKind,
  secret: IntegrationSecretPayload,
  endpoint?: Pick<GitHubEndpoint, 'repo'>,
): string {
  if (kind === 'github') return endpoint?.repo || 'GitHub repository'
  const hostname = safeHostname(secret.url)
  if (hostname) return `${hostname} ••••${createHash('sha256').update(secret.url || '').digest('hex').slice(-4)}`
  return `${kind} endpoint`
}

export function redactWebhookDestination(value?: string | null): string {
  if (!value) return 'Integration endpoint'
  if (!value.includes('://')) return value.slice(0, 200)
  const hostname = safeHostname(value)
  if (!hostname) return 'Integration endpoint'
  return `${hostname} ••••${createHash('sha256').update(value).digest('hex').slice(-4)}`
}

export function extractEndpointSecret(
  kind: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
): IntegrationSecretPayload {
  return {
    ...(endpoint.url ? { url: endpoint.url } : {}),
    ...(kind === 'github' && (endpoint as GitHubEndpoint).token
      ? { token: (endpoint as GitHubEndpoint).token }
      : {}),
    ...(kind === 'generic' && endpoint.signingSecret
      ? { signingSecret: endpoint.signingSecret }
      : {}),
  }
}

export function hasRequiredEndpointSecret(kind: WebhookKind, secret: IntegrationSecretPayload): boolean {
  if (kind === 'github') return Boolean(secret.token)
  return Boolean(secret.url)
}

export function toSafeEndpoint(
  kind: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
  destinationHint?: string,
): WebhookEndpoint | GitHubEndpoint {
  const base: WebhookEndpoint = {
    id: endpoint.id,
    url: kind === 'github' ? endpoint.url : '',
    enabled: endpoint.enabled,
    delivery: endpoint.delivery,
    rules: endpoint.rules,
    format: endpoint.format,
    secretStored: true,
    destinationHint: destinationHint || integrationDestinationHint(kind, extractEndpointSecret(kind, endpoint)),
  }

  if (kind === 'github') {
    const github = endpoint as GitHubEndpoint
    return {
      ...base,
      repo: github.repo,
      token: '',
      labels: github.labels,
    }
  }
  return base
}

export function toSafeWebhookConfig(config: WebhookConfig): WebhookConfig {
  const safe: WebhookConfig = {}
  for (const kind of ['slack', 'discord', 'generic', 'github'] as const) {
    const endpoints = kind === 'github'
      ? config.github?.endpoints
      : config[kind]?.endpoints
    if (!endpoints?.length) continue
    const safeEndpoints = endpoints.map((endpoint) => toSafeEndpoint(kind, endpoint, endpoint.destinationHint))
    if (kind === 'github') safe.github = { endpoints: safeEndpoints as GitHubEndpoint[] }
    else safe[kind] = { endpoints: safeEndpoints as WebhookEndpoint[] }
  }
  return safe
}

export async function loadIntegrationSecrets(
  admin: SupabaseClient<Database>,
  projectId: string,
): Promise<Map<string, { kind: WebhookKind; secret: IntegrationSecretPayload; destinationHint: string }>> {
  const { data, error } = await admin
    .from('project_integration_secrets')
    .select('endpoint_id, kind, ciphertext, initialization_vector, auth_tag, key_version, destination_hint')
    .eq('project_id', projectId)

  if (error) throw new Error(error.message)

  return new Map((data || []).map((row) => [
    row.endpoint_id,
    {
      kind: row.kind as WebhookKind,
      secret: decryptSecret(row as StoredIntegrationSecret),
      destinationHint: row.destination_hint,
    },
  ]))
}

export async function saveIntegrationSecret(
  admin: SupabaseClient<Database>,
  projectId: string,
  kind: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
  secret: IntegrationSecretPayload,
): Promise<string> {
  if (!hasRequiredEndpointSecret(kind, secret)) {
    throw new Error(kind === 'github' ? 'A GitHub token is required' : 'A valid webhook URL is required')
  }

  const destinationHint = integrationDestinationHint(
    kind,
    secret,
    kind === 'github' ? endpoint as GitHubEndpoint : undefined,
  )
  const encrypted = encryptSecret(secret)
  const { error } = await admin
    .from('project_integration_secrets')
    .upsert({
      project_id: projectId,
      endpoint_id: endpoint.id,
      kind,
      ...encrypted,
      destination_hint: destinationHint,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,endpoint_id' })

  if (error) throw new Error(error.message)
  return destinationHint
}

export async function removeStaleIntegrationSecrets(
  admin: SupabaseClient<Database>,
  projectId: string,
  activeEndpointIds: string[],
) {
  let query = admin
    .from('project_integration_secrets')
    .delete()
    .eq('project_id', projectId)

  if (activeEndpointIds.length > 0) query = query.not('endpoint_id', 'in', `(${activeEndpointIds.join(',')})`)
  const { error } = await query
  if (error) throw new Error(error.message)
}

export function hydrateEndpoint(
  kind: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
  secret: IntegrationSecretPayload,
): WebhookEndpoint | GitHubEndpoint {
  const hydrated = {
    ...endpoint,
    url: secret.url || endpoint.url,
    ...(kind === 'generic' ? { signingSecret: secret.signingSecret } : {}),
  }

  if (kind === 'github') {
    return {
      ...(hydrated as GitHubEndpoint),
      token: secret.token || '',
    }
  }
  return hydrated
}

export async function resolveIntegrationEndpoint(
  admin: SupabaseClient<Database>,
  projectId: string,
  kind: WebhookKind,
  endpoint: WebhookEndpoint | GitHubEndpoint,
): Promise<{ endpoint: WebhookEndpoint | GitHubEndpoint; destinationHint: string }> {
  if (!endpoint.secretStored) {
    return {
      endpoint,
      destinationHint: integrationDestinationHint(kind, extractEndpointSecret(kind, endpoint), kind === 'github' ? endpoint as GitHubEndpoint : undefined),
    }
  }

  const secrets = await loadIntegrationSecrets(admin, projectId)
  const stored = secrets.get(endpoint.id)
  if (!stored || stored.kind !== kind) throw new Error('Integration credential is missing')
  return {
    endpoint: hydrateEndpoint(kind, endpoint, stored.secret),
    destinationHint: stored.destinationHint,
  }
}

export async function persistWebhookConfig(
  admin: SupabaseClient<Database>,
  projectId: string,
  input: unknown,
): Promise<WebhookConfig> {
  const normalized = normalizeWebhookConfig(input)
  const existing = await loadIntegrationSecrets(admin, projectId)
  const safe: WebhookConfig = {}
  const activeEndpointIds: string[] = []

  for (const kind of ['slack', 'discord', 'generic', 'github'] as const) {
    const endpoints = kind === 'github'
      ? normalized.github?.endpoints
      : normalized[kind]?.endpoints
    if (!endpoints?.length) continue

    const safeEndpoints: Array<WebhookEndpoint | GitHubEndpoint> = []
    for (const endpoint of endpoints) {
      const incoming = extractEndpointSecret(kind, endpoint)
      const prior = existing.get(endpoint.id)
      const secret: IntegrationSecretPayload = {
        url: incoming.url || prior?.secret.url,
        token: incoming.token || prior?.secret.token,
        signingSecret: incoming.signingSecret || prior?.secret.signingSecret,
      }
      if (!hasRequiredEndpointSecret(kind, secret)) {
        throw new Error(kind === 'github' ? 'Enter a GitHub token before saving' : 'Enter a valid HTTPS webhook URL before saving')
      }

      const destinationHint = await saveIntegrationSecret(admin, projectId, kind, endpoint, secret)
      safeEndpoints.push(toSafeEndpoint(kind, endpoint, destinationHint))
      activeEndpointIds.push(endpoint.id)
    }

    if (kind === 'github') safe.github = { endpoints: safeEndpoints as GitHubEndpoint[] }
    else safe[kind] = { endpoints: safeEndpoints as WebhookEndpoint[] }
  }

  await removeStaleIntegrationSecrets(admin, projectId, activeEndpointIds)
  return safe
}
