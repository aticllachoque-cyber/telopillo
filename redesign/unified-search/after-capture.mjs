// Stage 8 after-captures for unified-search: /buscar after the redesign,
// same 3 viewports and shot names as current-capture.mjs for comparison.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./after/', import.meta.url).pathname

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

const browser = await chromium.launch()
const lines = ['unified-search after captures — 2026-09-16']

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto(`${BASE}/buscar?q=samsung`, { waitUntil: 'load' })
  await page
    .waitForSelector('a[href^="/productos/"], text=/no se encontraron/i', { timeout: 60_000 })
    .catch(() => {})
  // let the debounced tab counters settle
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}${name}-resultados.png` })
  const s1 = await page.evaluate(() => document.body.innerText.slice(0, 200))

  await page.goto(`${BASE}/buscar?q=zzzznoexiste`, { waitUntil: 'load' })
  await page.waitForSelector('text=/no se encontraron/i', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}${name}-vacio.png` })
  const s2 = await page.evaluate(() => document.body.innerText.slice(0, 200))

  // header state at this viewport (type selector / overlay entry point)
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${DIR}${name}-header.png` })

  lines.push(`${name}: resultados "${s1.split('\n')[0] ?? ''}" | vacío "${s2.split('\n')[0] ?? ''}"`)
  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
await browser.close()
console.log('after captures done')
