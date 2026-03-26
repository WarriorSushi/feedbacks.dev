import fs from 'node:fs'
import path from 'node:path'
import { getE2EEnvironment } from './helpers/seed'

export default async function globalSetup() {
  const env = getE2EEnvironment()
  const outputDir = path.join(process.cwd(), 'output', 'playwright')
  fs.mkdirSync(outputDir, { recursive: true })

  if (!env.ready) {
    console.warn(`[playwright] e2e suite will skip: ${env.skipReason}`)
    return
  }

  const authDir = path.join(process.cwd(), 'packages', 'dashboard', '.auth')
  fs.mkdirSync(authDir, { recursive: true })
}
