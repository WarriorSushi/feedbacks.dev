import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const path = new URL('../packages/dashboard/.env.local', import.meta.url)
  let contents = ''
  try {
    contents = readFileSync(path, 'utf8')
  } catch {
    return
  }
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

loadLocalEnv()

const apply = process.argv.includes('--apply')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const encodedEncryptionKey = process.env.INTEGRATION_SECRET_ENCRYPTION_KEY

if (!supabaseUrl || !serviceRoleKey || !encodedEncryptionKey) {
  throw new Error('Supabase credentials and INTEGRATION_SECRET_ENCRYPTION_KEY are required')
}

const encryptionKey = Buffer.from(encodedEncryptionKey, 'base64')
if (encryptionKey.length !== 32) {
  throw new Error('INTEGRATION_SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function encrypt(payload) {
  const initializationVector = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, initializationVector)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])
  return {
    ciphertext: ciphertext.toString('base64'),
    initialization_vector: initializationVector.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
    key_version: 1,
  }
}

function hint(kind, secret, endpoint) {
  if (kind === 'github') return endpoint.repo || 'GitHub repository'
  let hostname = `${kind} endpoint`
  try {
    hostname = new URL(secret.url).hostname.replace(/^www\./, '')
  } catch {}
  const suffix = createHash('sha256').update(secret.url || '').digest('hex').slice(-4)
  return `${hostname} ••••${suffix}`
}

function endpointGroups(config) {
  return ['slack', 'discord', 'generic', 'github'].flatMap((kind) =>
    (config?.[kind]?.endpoints || []).map((endpoint) => ({ kind, endpoint })),
  )
}

let scanned = 0
let affectedProjects = 0
let migratedEndpoints = 0
let from = 0
const pageSize = 200

while (true) {
  const { data: projects, error } = await admin
    .from('projects')
    .select('id, webhooks')
    .not('webhooks', 'is', null)
    .range(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  if (!projects?.length) break

  for (const project of projects) {
    scanned += 1
    const config = project.webhooks && typeof project.webhooks === 'object' ? structuredClone(project.webhooks) : {}
    const legacy = endpointGroups(config).filter(({ endpoint }) => endpoint && endpoint.secretStored !== true)
    if (legacy.length === 0) continue
    affectedProjects += 1

    for (const { kind, endpoint } of legacy) {
      if (!endpoint.id) endpoint.id = `${kind}-${crypto.randomUUID()}`
      const secret = {
        ...(endpoint.url ? { url: endpoint.url } : {}),
        ...(kind === 'github' && endpoint.token ? { token: endpoint.token } : {}),
        ...(kind === 'generic' && endpoint.signingSecret ? { signingSecret: endpoint.signingSecret } : {}),
      }
      const valid = kind === 'github' ? Boolean(secret.token) : Boolean(secret.url)
      if (!valid) continue

      const destinationHint = hint(kind, secret, endpoint)
      if (apply) {
        const { error: secretError } = await admin
          .from('project_integration_secrets')
          .upsert({
            project_id: project.id,
            endpoint_id: endpoint.id,
            kind,
            ...encrypt(secret),
            destination_hint: destinationHint,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'project_id,endpoint_id' })
        if (secretError) throw new Error(secretError.message)
      }

      endpoint.url = kind === 'github' ? endpoint.url : ''
      if ('token' in endpoint) endpoint.token = ''
      delete endpoint.signingSecret
      endpoint.secretStored = true
      endpoint.destinationHint = destinationHint
      migratedEndpoints += 1
    }

    if (apply) {
      const { error: projectError } = await admin
        .from('projects')
        .update({ webhooks: config, updated_at: new Date().toISOString() })
        .eq('id', project.id)
      if (projectError) throw new Error(projectError.message)
    }
  }

  if (projects.length < pageSize) break
  from += pageSize
}

console.log(JSON.stringify({
  mode: apply ? 'applied' : 'dry-run',
  scannedProjects: scanned,
  affectedProjects,
  migratedEndpoints,
}))
