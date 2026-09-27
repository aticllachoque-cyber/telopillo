// Stage 3 current captures for home-publish-cta: / (landing)
// 3 viewports, anon, fullPage, dsf=2. Publish CTA visibility probe included.
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./current/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const LANDMARK = 'Lo buscás, ¡te lo pillo!'

const browser = await chromium.launch()
const lines = ['home-publish-cta current captures — 2026-09-22', 'route: / | state: anon | source: dev server (working tree = main 436af44 landing; branch docs/play-store-material docs-only)']
let domCaptured = false

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  const res = await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForSelector(`text=${LANDMARK}`, { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })

  if (!domCaptured) {
    writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page.locator('main').first().ariaSnapshot().catch(() => 'aria snapshot unavailable')
    writeFileSync(`${DIR}dom.txt`, `# / — viewport ${name}, anon\n\n${aria}\n`)
    domCaptured = true
  }

  // Publish CTA visibility probe (evidence for audit F-n)
  const publishLinks = await page.locator('a:has-text("Publicar"), a:has-text("Publicá"), a:has-text("publicá")').all()
  let visible = 0
  for (const l of publishLinks) {
    if (await l.boundingBox()) visible++
  }
  lines.push(`${name}: / | viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2, anon | publish links: total=${publishLinks.length} visible=${visible}`)

  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
await browser.close()
console.log('current captures done')
