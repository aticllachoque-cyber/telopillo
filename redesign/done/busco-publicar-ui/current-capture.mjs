// Stage 3 current-capture for busco-publicar-ui: demand wizard, 3 viewports,
// 2 states each (step 1 + step 4 review). Same manifest discipline as
// publicar-a11y: fullPage dsf=2, logged-in, drafts cleared before load.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./current/', import.meta.url).pathname
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

  // walk to step 4 review
  await page.locator('#title').fill('Busco iPhone 13 en buen estado')
  await page.locator('[role="radio"]').first().click()
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForTimeout(700)
  await page.locator('#description').fill('Busco iPhone 13 de 128GB, batería sobre 85 por ciento, con caja y accesorios originales.')
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
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${DIR}${vp}-revision.png`, fullPage: true })
  manifest.push(`${vp}-revision.png | /busco/publicar paso4 revisión | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${resp.status()} | 2026-09-15 | logged-in`)

  await ctx.close()
}
await browser.close()

writeFileSync(DIR + 'manifest.txt', manifest.join('\n') + '\n')
writeFileSync(DIR + 'dom.txt', doms.join('\n---\n'))
writeFileSync(DIR + 'http-status.txt', `${lastStatus}\n`)
console.log('current-captures done:', manifest.length, 'shots')
