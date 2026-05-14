import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const filePath = resolve(process.cwd(), 'next-env.d.ts')
const stableImport = `import './.next/types/routes.d.ts'`
const devImport = `import "./.next/dev/types/routes.d.ts";`

const current = readFileSync(filePath, 'utf8')

if (!current.includes(devImport)) {
  process.exit(0)
}

const normalized = current.replace(devImport, stableImport)

if (normalized !== current) {
  writeFileSync(filePath, normalized, 'utf8')
  console.log('Normalized next-env.d.ts to stable route types path.')
}
