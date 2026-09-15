// Stage 3 captures for publicar-a11y — 3 viewports x 2 routes, fullPage dsf=2, logged-in.
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
const ROUTES = {
  '': { url: '/publicar', wait: 'text=Publicar Producto' },
  'demanda-': { url: '/busco/publicar', wait: 'text=Publicá lo que buscás' },
}

const browser = await chromium.launch()
const manifest = []
for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const page = await context.newPage()
  for (const [rName, r] of Object.entries(ROUTES)) {
    const resp = await page.goto(BASE + r.url, { waitUntil: 'load' })
    await page.waitForSelector(r.wait, { timeout: 15_000 })
    await page.waitForTimeout(1000)
    const file = `${rName}${vpName}.png`
    await page.screenshot({ path: OUT + file, fullPage: true })
    const status = resp?.status() ?? 0
    if (rName === '') {
      writeFileSync(OUT + 'http-status.txt', `${status}\n`)
      writeFileSync(
        OUT + 'dom.txt',
        await page.evaluate(() => document.body.innerText.slice(0, 4000))
      )
    }
    manifest.push(
      `${file} | ${r.url} | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${status} | 2026-09-15 | logged-in`
    )
  }
  await context.close()
}
writeFileSync(OUT + 'manifest.txt', manifest.join('\n') + '\n')
await browser.close()
console.log('captured:', manifest.length, 'shots')
