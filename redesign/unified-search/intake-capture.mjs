// Stage 1 intake for unified-search: current header search (desktop + mobile)
// and /buscar with results, so the redesign covers both surfaces.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./input/', import.meta.url).pathname

const browser = await chromium.launch()

// Desktop: header search bar + /buscar results
const desktop = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
})
const dpage = await desktop.newPage()

await dpage.goto(BASE + '/', { waitUntil: 'load' })
await dpage.waitForTimeout(1200)
await dpage.screenshot({ path: `${DIR}header-desktop.png` })
await dpage.goto(BASE + '/buscar?q=samsung', { waitUntil: 'load' })
await dpage.waitForTimeout(1500)
await dpage.screenshot({ path: `${DIR}buscar-resultados-desktop.png`, fullPage: false })
const status = dpage.url()

// Mobile: header + search overlay (the duplicated inline form under audit)
const mobile = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
})
const mpage = await mobile.newPage()
await mpage.goto(BASE + '/', { waitUntil: 'load' })
await mpage.waitForTimeout(1200)
await mpage.screenshot({ path: `${DIR}header-mobile.png` })
// open the mobile search overlay if present
const searchToggle = mpage.getByRole('button', { name: /buscar/i })
if (await searchToggle.count()) {
  await searchToggle.first().click()
  await mpage.waitForTimeout(800)
  await mpage.screenshot({ path: `${DIR}header-mobile-search-overlay.png` })
}

writeFileSync(
  `${DIR}manifest.txt`,
  [
    'unified-search intake — 2026-09-16',
    'user screenshot: header with logo + "Buscar productos..." input + Buscar button + nav (see header-desktop.png / header-mobile.png)',
    `buscar-resultados-desktop.png — ${status}`,
    'header-mobile.png — mobile header, collapsed search',
    'header-mobile-search-overlay.png — mobile search overlay (duplicate inline form F-finding candidate)',
  ].join('\n') + '\n'
)

await browser.close()
console.log('intake captures done')
