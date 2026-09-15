// Stage 3 captures for storefront-a11y — 3 viewports x 2 states, fullPage dsf=2.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const OUT = new URL('./current/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}
const STATES = {
  '': { url: '/negocio/tienda-electronica-la-paz', wait: 'h1' },
  '404-': { url: '/negocio/usuario-de-desarrollo', wait: 'body' },
}

const browser = await chromium.launch()
const manifest = []
for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await context.newPage()
  for (const [stName, st] of Object.entries(STATES)) {
    const resp = await page.goto(BASE + st.url, { waitUntil: 'networkidle' })
    await page.waitForSelector(st.wait, { timeout: 15_000 })
    await page.waitForTimeout(500)
    const file = `${stName}${vpName}.png`
    await page.screenshot({ path: OUT + file, fullPage: true })
    const status = resp?.status() ?? 0
    if (stName === '') {
      writeFileSync(OUT + 'http-status.txt', '200\n')
      writeFileSync(
        OUT + 'dom.txt',
        await page.evaluate(() => document.body.innerText.slice(0, 4000))
      )
    }
    manifest.push(
      `${file || vpName + '.png'} | ${st.url} | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${status} | 2026-09-15 | public`
    )
  }
  await context.close()
}
writeFileSync(OUT + 'manifest.txt', manifest.join('\n') + '\n')
await browser.close()
console.log('captured:', manifest.length, 'shots')
