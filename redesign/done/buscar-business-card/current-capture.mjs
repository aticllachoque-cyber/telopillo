// Stage 3 current captures for buscar-business-card: /buscar?type=negocios
// (results + empty) across 3 viewports, plus the productos tab as the
// reference pattern. Canonical names desktop/tablet/mobile for the results
// state (landmark page), -vacio / -productos extras.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./current/', import.meta.url).pathname

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

const RESULTS_WAIT = 'a[href^="/negocio/"], text=/no se encontraron/i'

const browser = await chromium.launch()
const lines = ['buscar-business-card current captures — 2026-09-16']
let domCaptured = false

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  // Negocios tab with results — canonical capture for this item
  const res = await page.goto(`${BASE}/buscar?type=negocios&q=electronica`, {
    waitUntil: 'load',
  })
  await page.waitForSelector(RESULTS_WAIT, { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
  if (!domCaptured) {
    writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page
      .locator('[role="tablist"], ul[role="list"]')
      .first()
      .ariaSnapshot()
      .catch(() => 'aria snapshot unavailable')
    writeFileSync(
      `${DIR}dom.txt`,
      `# /buscar?type=negocios&q=electronica — viewport ${name}\n\n${aria}\n`,
    )
    domCaptured = true
  }

  // Empty state
  await page.goto(`${BASE}/buscar?type=negocios&q=zzzznoexiste`, { waitUntil: 'load' })
  await page.waitForSelector('text=/no se encontraron/i', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}-vacio.png`, fullPage: true })

  // Productos tab — the "similar a producto" reference surface
  await page.goto(`${BASE}/buscar?q=electronica`, { waitUntil: 'load' })
  await page
    .waitForSelector('a[href^="/productos/"], text=/no se encontraron/i', { timeout: 60_000 })
    .catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}-productos.png`, fullPage: true })

  lines.push(
    `${name}: negocios q=electronica | vacio | productos reference (viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2)`,
  )
  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
await browser.close()
console.log('current captures done')
