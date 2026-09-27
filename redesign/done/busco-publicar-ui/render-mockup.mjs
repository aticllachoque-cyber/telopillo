// Stage 6 render: mockup HTML at matched viewports (file:// fine — CSS
// inlined at build). 2 states x 3 viewports, fullPage dsf=2, per mandate.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const DIR = new URL('./', import.meta.url).pathname
const PROPOSAL = DIR + 'proposal/'
mkdirSync(PROPOSAL, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
const manifest = []

for (const state of ['paso2', 'paso4']) {
  for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(`file://${PROPOSAL}mockup-${state}.html`, { waitUntil: 'load' })
    await page.waitForTimeout(1200)
    const out = `${PROPOSAL}render-${state}-${vp}.png`
    await page.screenshot({ path: out, fullPage: true })
    manifest.push(`render-${state}-${vp}.png | mockup-paso${state === 'paso2' ? '2' : '4'} | ${viewport.width}x${viewport.height} | fullPage dsf=2 | 2026-09-15`)
    await ctx.close()
  }
}
await browser.close()
writeFileSync(PROPOSAL + 'render-manifest.txt', manifest.join('\n') + '\n')
console.log('renders done:', manifest.length)
