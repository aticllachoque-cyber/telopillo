// Stage 6 render: mockup HTML at matched viewports (file:// fine — CSS
// inlined at build). 2 desktop states + 1 mobile, fullPage dsf=2.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const DIR = new URL('./', import.meta.url).pathname
const PROPOSAL = DIR + 'proposal/'
mkdirSync(PROPOSAL, { recursive: true })

const STATES = [
  { file: 'mockup-tabs-productos', vp: 'desktop', width: 1920, height: 1080 },
  { file: 'mockup-tabs-negocios', vp: 'desktop', width: 1920, height: 1080 },
  { file: 'mockup-mobile-overlay', vp: 'mobile', width: 375, height: 812 },
]

const browser = await chromium.launch()
const manifest = []

for (const { file, vp, width, height } of STATES) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`file://${PROPOSAL}${file}.html`, { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  const out = `${PROPOSAL}render-${file.replace('mockup-', '')}-${vp}.png`
  await page.screenshot({ path: out, fullPage: true })
  manifest.push(`${out.split('/').pop()} | ${file} | ${width}x${height} | fullPage dsf=2 | 2026-09-16`)
  await ctx.close()
}
await browser.close()
writeFileSync(PROPOSAL + 'render-manifest.txt', manifest.join('\n') + '\n')
console.log('renders done:', manifest.length)
