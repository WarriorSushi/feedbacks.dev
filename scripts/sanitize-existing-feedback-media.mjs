import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

try {
  const contents = readFileSync(new URL('../packages/dashboard/.env.local', import.meta.url), 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase credentials are required')

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: rows, error } = await admin
  .from('feedback_media')
  .select('id, bucket, storage_path, mime_type')
  .eq('scan_status', 'pending')
  .limit(1000)
if (error) throw new Error(error.message)

let cleaned = 0
let rejected = 0
for (const row of rows || []) {
  try {
    const { data: blob, error: downloadError } = await admin.storage.from(row.bucket).download(row.storage_path)
    if (downloadError || !blob) throw downloadError || new Error('Download failed')
    const input = Buffer.from(await blob.arrayBuffer())
    const isPng = input.length >= 8
      && input[0] === 0x89
      && input.subarray(1, 4).toString('ascii') === 'PNG'
    const isJpeg = input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff
    const detectedMime = isPng ? 'image/png' : isJpeg ? 'image/jpeg' : null
    if (!detectedMime || detectedMime !== row.mime_type) throw new Error('Magic bytes do not match')

    const image = sharp(input, { failOn: 'warning', limitInputPixels: 25_000_000 })
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000) {
      throw new Error('Invalid dimensions')
    }
    const output = detectedMime === 'image/png'
      ? await image.rotate().png({ compressionLevel: 9 }).toBuffer()
      : await image.rotate().jpeg({ quality: 88, mozjpeg: true }).toBuffer()
    const { error: uploadError } = await admin.storage
      .from(row.bucket)
      .upload(row.storage_path, output, { contentType: detectedMime, upsert: true })
    if (uploadError) throw uploadError

    const { error: updateError } = await admin
      .from('feedback_media')
      .update({
        size_bytes: output.length,
        sha256: createHash('sha256').update(output).digest('hex'),
        scan_status: 'clean',
        scanned_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    if (updateError) throw updateError
    cleaned += 1
  } catch {
    await admin
      .from('feedback_media')
      .update({ scan_status: 'rejected', scanned_at: new Date().toISOString() })
      .eq('id', row.id)
    rejected += 1
  }
}

console.log(JSON.stringify({ examined: rows?.length || 0, cleaned, rejected }))
