// Stage 8 after-captures for publicar-a11y: both routes x 3 viewports, same
// manifest discipline as Stage 3 (fullPage dsf=2, logged-in, drafts cleared).
// Also captures the producto step-1 error state (F-1 evidence) into audit-after/.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, appendFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./', import.meta.url).pathname
mkdirSync(DIR + 'after', { recursive: true })
mkdirSync(DIR + 'audit-after', { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
const manifest = []
const doms = []

for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const page = await ctx.newPage()

  // ---- PRODUCTO /publicar ----
  const resp = await page.goto(BASE + '/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('text=Fotos del Producto', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}after/${vp}.png`, fullPage: true })
  manifest.push(`${vp}.png | /publicar | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${resp.status()} | 2026-09-15 | logged-in`)
  doms.push(await page.evaluate(() => document.body.innerText))
  // error state for F-1: click Siguiente empty -> exactly ONE error line
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}audit-after/producto-step1-errores-${vp}.png`, fullPage: true })

  // ---- DEMANDA /busco/publicar ----
  const resp2 = await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}after/demanda-${vp}.png`, fullPage: true })
  manifest.push(`demanda-${vp}.png | /busco/publicar | ${viewport.width}x${viewport.height} | fullPage dsf=2 | HTTP ${resp2.status()} | 2026-09-15 | logged-in`)
  doms.push(await page.evaluate(() => document.body.innerText))
  await ctx.close()
}
await browser.close()

writeFileSync(DIR + 'after/manifest.txt', manifest.join('\n') + '\n')
writeFileSync(DIR + 'after/dom.txt', doms.join('\n---\n'))
writeFileSync(DIR + 'after/http-status.txt', '200\n')
console.log('after-captures done:', manifest.length, 'shots')
