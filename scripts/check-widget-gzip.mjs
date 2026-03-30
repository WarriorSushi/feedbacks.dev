import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const file = new URL('../packages/widget/dist/widget.js', import.meta.url)
const buffer = readFileSync(file)
const gzipBytes = gzipSync(buffer).byteLength
const maxGzipBytes = 20 * 1024

console.log(`widget.js raw: ${buffer.byteLength} bytes`)
console.log(`widget.js gzip: ${gzipBytes} bytes`)

if (gzipBytes > maxGzipBytes) {
  console.error(`Widget gzip size exceeded budget: ${gzipBytes} > ${maxGzipBytes}`)
  process.exit(1)
}
