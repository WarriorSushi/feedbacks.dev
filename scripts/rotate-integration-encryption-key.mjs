import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  try {
    const contents = readFileSync(new URL('../packages/dashboard/.env.local', import.meta.url), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {}
}

loadLocalEnv()

const oldKey = Buffer.from(process.env.OLD_INTEGRATION_SECRET_ENCRYPTION_KEY || '', 'base64')
const newKey = Buffer.from(process.env.NEW_INTEGRATION_SECRET_ENCRYPTION_KEY || '', 'base64')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey || oldKey.length !== 32 || newKey.length !== 32) {
  throw new Error('Supabase credentials and valid old/new 32-byte integration keys are required')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function decryptWithKey(row, key) {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(row.initialization_vector, 'base64'))
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()])
}

function decrypt(row) {
  try {
    return { plaintext: decryptWithKey(row, oldKey), alreadyRotated: false }
  } catch {
    return { plaintext: decryptWithKey(row, newKey), alreadyRotated: true }
  }
}

function encrypt(plaintext) {
  const initializationVector = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', newKey, initializationVector)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    ciphertext: ciphertext.toString('base64'),
    initialization_vector: initializationVector.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
    key_version: 1,
    updated_at: new Date().toISOString(),
  }
}

let rotated = 0
let from = 0
const pageSize = 200
while (true) {
  const { data: rows, error } = await admin
    .from('project_integration_secrets')
    .select('id, ciphertext, initialization_vector, auth_tag')
    .range(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  if (!rows?.length) break

  for (const row of rows) {
    const decrypted = decrypt(row)
    if (decrypted.alreadyRotated) continue
    const { error: updateError } = await admin
      .from('project_integration_secrets')
      .update(encrypt(decrypted.plaintext))
      .eq('id', row.id)
    if (updateError) throw new Error(updateError.message)
    rotated += 1
  }

  if (rows.length < pageSize) break
  from += pageSize
}

console.log(JSON.stringify({ rotated }))
