import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const budgets = [
  { name: 'widget.js', maxGzipBytes: 20 * 1024 },
  { name: 'capture.mjs', maxGzipBytes: 55 * 1024 },
]

let failed = false
for (const { name, maxGzipBytes } of budgets) {
  const file = new URL(`../packages/widget/dist/${name}`, import.meta.url)
  const buffer = readFileSync(file)
  const gzipBytes = gzipSync(buffer).byteLength
  console.log(`${name} raw: ${buffer.byteLength} bytes`)
  console.log(`${name} gzip: ${gzipBytes} bytes`)

  if (gzipBytes > maxGzipBytes) {
    console.error(`${name} gzip size exceeded budget: ${gzipBytes} > ${maxGzipBytes}`)
    failed = true
  }
}

if (failed) process.exit(1)
