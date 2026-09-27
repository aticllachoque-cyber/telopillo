// Stage 3 current captures for busco-detalle: /busco/[id]
// Primary state (anon, image+budget+0 ofertas, closest to prod intake) +
// offers state (anon, 3 offers -> OfferCard list) across 3 viewports.
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

// Local seeded demands (public schema, checked 2026-09-18)
const PRIMARY_ID = '679962b7-ddfd-4a65-ab27-50d0b47d1859' // TV smart mini — img + budget + 0 offers
const OFFERS_ID = 'f8609770-80c1-441f-8c37-9729816ef450' // celular Android — 3 offers

const LANDMARK = 'Esta persona publicó la necesidad y recibirá las ofertas.'

const browser = await chromium.launch()
const lines = ['busco-detalle current captures — 2026-09-18']
let domCaptured = false
let domOffersCaptured = false

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  // Primary state — canonical capture for this item (anon)
  const res = await page.goto(`${BASE}/busco/${PRIMARY_ID}`, { waitUntil: 'load' })
  await page.waitForSelector(`text=${LANDMARK}`, { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
  if (!domCaptured) {
    writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page.locator('main').first().ariaSnapshot().catch(() => 'aria snapshot unavailable')
    writeFileSync(
      `${DIR}dom.txt`,
      `# /busco/${PRIMARY_ID} (canonical redirect) — viewport ${name}, anon\n\n${aria}\n`,
    )
    domCaptured = true
  }

  // Offers state — OfferCard list rendering (anon)
  await page.goto(`${BASE}/busco/${OFFERS_ID}`, { waitUntil: 'load' })
  await page.waitForSelector('text=/Ofertas \\(\\d+\\)/', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}-ofertas.png`, fullPage: true })
  if (!domOffersCaptured) {
    const aria = await page.locator('main').first().ariaSnapshot().catch(() => 'aria snapshot unavailable')
    writeFileSync(
      `${DIR}dom-ofertas.txt`,
      `# /busco/${OFFERS_ID} — viewport ${name}, anon, 3 offers\n\n${aria}\n`,
    )
    domOffersCaptured = true
  }

  lines.push(
    `${name}: primary ${PRIMARY_ID} | ofertas ${OFFERS_ID} (viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2, anon)`,
  )
  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
await browser.close()
console.log('current captures done')
