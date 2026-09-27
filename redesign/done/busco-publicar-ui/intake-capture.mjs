// Stage 1 intake for busco-publicar-ui: full demand wizard walkthrough captures
// (all 4 steps, desktop, logged-in) so the redesign covers the whole flow.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./input/', import.meta.url).pathname

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  storageState: 'tests/.auth/logged-in.json',
})
const page = await ctx.newPage()

const shots = []
async function snap(name) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
  shots.push(`${name}.png`)
}

await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
await page.waitForTimeout(1200)

// Step 1: fill title + pick category (to advance cleanly)
await snap('intake-paso1')
await page.locator('#title').fill('Busco iPhone 13 en buen estado')
await page.locator('[role="radio"]').first().click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)

// Step 2: description
await snap('intake-paso2')
await page.locator('#description').fill('Busco iPhone 13 de 128GB, batería sobre 85 por ciento, preferible con caja y accesorios originales.')
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)

// Step 3: budget + location
await snap('intake-paso3')
await page.locator('#price_min').fill('3000')
await page.locator('#price_max').fill('5500')
const dept = page.locator('button[role="combobox"]').first()
await dept.click()
await page.waitForTimeout(500)
await page.getByRole('option').first().click()
await page.waitForTimeout(300)
const city = page.locator('input[id*="city"], input[placeholder*="La Paz"]')
if (await city.count()) await city.first().fill('La Paz')
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(900)

// Step 4: review
await snap('intake-paso4')

writeFileSync(DIR + 'manifest.txt', shots.join('\n') + '\n')
console.log('intake done:', shots.length, 'shots')
await ctx.close()
await browser.close()
