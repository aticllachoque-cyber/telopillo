// Stage 8 after-capture for busco-publicar-ui: demand wizard with F-1..F-6
// implemented, 3 viewports, 2 states each (paso 1 + paso 4 revisión). Same
// manifest discipline as current-capture.mjs: fullPage dsf=2, logged-in,
// drafts cleared before load.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./after/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
const manifest = []
const doms = []
let lastStatus = 200

for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const page = await ctx.newPage()

  const resp = await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
  lastStatus = resp.status()
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}${vp}.png`, fullPage: true })
  manifest.push(`${vp}.png | /busco/publicar paso1 | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${resp.status()} | 2026-09-15 | logged-in`)
  if (vp === 'desktop') doms.push(await page.evaluate(() => document.body.innerText))

  // walk to paso 2 (F-2 heading asserted live), fill, click first F-4 chip
  await page.locator('#title').fill('Busco iPhone 13 en buen estado')
  await page.locator('[role="radio"]').first().click()
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForSelector('text=Descripción de lo que buscás', { timeout: 15_000 })
  await page.locator('#description').fill('Busco iPhone 13 de 128GB, batería sobre 85 por ciento, con caja y accesorios originales.')
  const chip = page.locator('#subcategory button[aria-pressed]').first()
  if (await chip.count()) await chip.click()
  await page.waitForTimeout(300)
  if (vp === 'desktop') await page.screenshot({ path: `${DIR}${vp}-paso2.png`, fullPage: true })

  // walk to paso 4 revisión
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForTimeout(700)
  await page.locator('button[role="combobox"]').first().click()
  await page.waitForTimeout(400)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(400)
  await page.locator('button[role="combobox"]').nth(1).click()
  await page.waitForTimeout(400)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(300)
  await page.locator('#price_min').fill('3000')
  await page.locator('#price_max').fill('5500')
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForSelector('text=Verificación de tu solicitud', { timeout: 15_000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${DIR}${vp}-revision.png`, fullPage: true })
  manifest.push(`${vp}-revision.png | /busco/publicar paso4 revisión | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${resp.status()} | 2026-09-15 | logged-in`)
  if (vp === 'desktop') doms.push(await page.evaluate(() => document.body.innerText))

  await ctx.close()
}
await browser.close()

writeFileSync(DIR + 'manifest.txt', manifest.join('\n') + '\n')
writeFileSync(DIR + 'dom.txt', doms.join('\n---\n'))
writeFileSync(DIR + 'http-status.txt', `${lastStatus}\n`)
console.log('after-captures done:', manifest.length, 'shots')
