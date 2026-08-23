import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'packages', 'widget', 'dist')
const target = join(root, 'packages', 'dashboard', 'public', 'widget')

mkdirSync(target, { recursive: true })
copyFileSync(join(source, 'widget.js'), join(target, 'latest.js'))
copyFileSync(join(source, 'widget.js'), join(target, 'v2.js'))
copyFileSync(join(source, 'capture.mjs'), join(target, 'capture.mjs'))
console.log('Widget runtime and capture renderer copied to public/widget/')
