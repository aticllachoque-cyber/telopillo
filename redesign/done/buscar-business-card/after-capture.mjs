// Stage 8 after-captures for buscar-business-card: /buscar?type=negocios and
// type=personas (results only — container/card redesign, empty state untouched)
// across 3 viewports, fullPage dsf=2.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./after/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

const browser = await chromium.launch()
const lines = ['buscar-business-card after captures — 2026-09-16 (post-impl)']
let domCaptured = false

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  const res = await page.goto(`${BASE}/buscar?type=negocios&q=electronica`, { waitUntil: 'load' })
  if (!domCaptured) {
    const { writeFileSync: wf } = await import('fs')
    wf(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page
      .locator('[role="tablist"], ul[role="list"]')
      .first()
      .ariaSnapshot()
      .catch(() => 'aria snapshot unavailable')
    wf(`${DIR}dom.txt`, `# /buscar?type=negocios&q=electronica — viewport ${name}\n\n${aria}\n`)
    domCaptured = true
  }
  await page.waitForSelector('a[href^="/negocio/"]', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })

  await page.goto(`${BASE}/buscar?type=personas&q=electronica`, { waitUntil: 'load' })
  await page
    .waitForSelector('a[href^="/vendedor/"], a[href^="/negocio/"]', { timeout: 60_000 })
    .catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}-personas.png`, fullPage: true })

  lines.push(`${name}: negocios + personas q=electronica (viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2)`)
  await ctx.close()
}

const { writeFileSync } = await import('fs')
writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
await browser.close()
console.log('after captures done')
