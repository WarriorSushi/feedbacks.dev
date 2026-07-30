import { readFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const dashboardRoot = path.resolve('packages/dashboard')
const nextRoot = path.join(dashboardRoot, '.next')
const manifestPath = path.join(nextRoot, 'app-build-manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

const gzipCache = new Map()
async function gzipBytes(relativeFile) {
  if (gzipCache.has(relativeFile)) return gzipCache.get(relativeFile)
  const absoluteFile = path.join(nextRoot, relativeFile)
  try {
    const info = await stat(absoluteFile)
    if (!info.isFile()) return 0
    const bytes = gzipSync(await readFile(absoluteFile)).byteLength
    gzipCache.set(relativeFile, bytes)
    return bytes
  } catch {
    return 0
  }
}

function routeBudget(route) {
  if (route === '/page') return 220 * 1024
  if (route.startsWith('/auth')) return 240 * 1024
  if (route.startsWith('/boards') || route.startsWith('/p/')) return 240 * 1024
  if (route.includes('/projects/[id]')) return 320 * 1024
  return 280 * 1024
}

const failures = []
const rows = []
for (const [route, assets] of Object.entries(manifest.pages)) {
  if (route.startsWith('/api/') || !route.endsWith('/page')) continue
  const scripts = [...new Set(assets.filter((asset) => asset.endsWith('.js')))]
  const bytes = (await Promise.all(scripts.map(gzipBytes))).reduce((sum, value) => sum + value, 0)
  const budget = routeBudget(route)
  rows.push({ route, bytes, budget })
  if (bytes > budget) failures.push({ route, bytes, budget })
}

for (const row of rows.sort((left, right) => right.bytes - left.bytes).slice(0, 12)) {
  console.log(`${row.route}: ${(row.bytes / 1024).toFixed(1)} kB gzip / ${(row.budget / 1024).toFixed(0)} kB`)
}

if (failures.length) {
  console.error('Dashboard route JavaScript budget exceeded:')
  for (const failure of failures) {
    console.error(`- ${failure.route}: ${(failure.bytes / 1024).toFixed(1)} kB > ${(failure.budget / 1024).toFixed(0)} kB`)
  }
  process.exit(1)
}

console.log(`Dashboard route budgets passed for ${rows.length} routes.`)
