// Supplement: capture real step 4 (review) + step 3 with city selected.
import { chromium } from '@playwright/test'
import { appendFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./input/', import.meta.url).pathname

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  storageState: 'tests/.auth/logged-in.json',
})
const page = await ctx.newPage()

await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
await page.waitForTimeout(1200)

await page.locator('#title').fill('Busco iPhone 13 en buen estado')
await page.locator('[role="radio"]').first().click()
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)
await page.locator('#description').fill('Busco iPhone 13 de 128GB, batería sobre 85 por ciento, preferible con caja y accesorios originales.')
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)

// step 3: department + city (both comboboxes)
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
await page.waitForTimeout(400)
await page.screenshot({ path: `${DIR}intake-paso3-completo.png`, fullPage: true })
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${DIR}intake-paso4-revision.png`, fullPage: true })

appendFileSync(DIR + 'manifest.txt', 'intake-paso3-completo.png\nintake-paso4-revision.png\n')
console.log('supplement done')
await ctx.close()
await browser.close()
