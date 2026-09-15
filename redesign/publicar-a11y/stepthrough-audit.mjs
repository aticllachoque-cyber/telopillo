// Stage 4 step-through audit for publicar-a11y: drive both wizards through all
// steps (axe per step + validation-error state), desktop + mobile, logged-in.
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, appendFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./', import.meta.url).pathname
mkdirSync(DIR + 'audit', { recursive: true })
const LOG = DIR + 'audit/stepthrough.txt'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag22aa']

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

function log(s) {
  appendFileSync(LOG, s + '\n')
  console.log(s)
}

async function axeStep(page, label, vp) {
  await page.waitForTimeout(500)
  const t0 = Date.now()
  const res = await Promise.race([
    new AxeBuilder({ page }).withTags(TAGS).analyze(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('AXE-TIMEOUT')), 60_000)),
  ])
  const bad = res.violations.filter((v) =>
    ['serious', 'critical', 'moderate'].includes(v.impact)
  )
  log(`\n[${vp}] ${label} — axe ${Date.now() - t0}ms, ${bad.length} violation(s)`)
  for (const v of bad) {
    log(`  - ${v.id} (${v.impact}): ${v.nodes.length} node(s)`)
    for (const n of v.nodes.slice(0, 5)) {
      log(`     target: ${n.target.join(' ')}`)
      log(`     html: ${n.html.slice(0, 140)}`)
      const c = n.any.find((x) => x.id === 'color-contrast')
      if (c?.data)
        log(
          `     contrast: fg=${c.data.fgColor} bg=${c.data.bgColor} ratio=${c.data.contrastRatio}`
        )
    }
  }
  await page.screenshot({
    path: `${DIR}audit/${label.replace(/\s+/g, '-')}-${vp}.png`,
    fullPage: true,
  })
  return bad
}

async function next(page) {
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForTimeout(700)
}

const browser = await chromium.launch()
for (const [vp, viewport] of Object.entries({
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
})) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const page = await ctx.newPage()

  // ---------- PRODUCTO ----------
  await page.goto(BASE + '/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.waitForSelector('text=Fotos del Producto', { timeout: 20_000 })
  await page.waitForTimeout(1500)
  log(`\n===== PRODUCTO [${vp}] =====`)
  await axeStep(page, 'producto-step1', vp)
  // validation-error state: click Siguiente with empty form
  await next(page)
  await axeStep(page, 'producto-step1-errores', vp)

  // fill step 1: upload image
  await page.setInputFiles('input[type="file"]', { name: 'foto.png', mimeType: 'image/png', buffer: PNG })
  await page.waitForTimeout(2500)
  await next(page)

  // step 2: title, description, category
  await page.waitForSelector('#category-grid, [aria-label="Categoría del producto"]', { timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(500)
  await axeStep(page, 'producto-step2', vp)
  const titleInput = page.locator('input[placeholder*="iPhone"]').first()
  await titleInput.fill('Test iphone barrido')
  await page.locator('textarea').first().fill('Descripcion de prueba para el barrido de auditoria de accesibilidad del formulario.')
  await page.locator('[role="radio"]').first().click()
  await page.waitForTimeout(800)
  await next(page)

  // step 3: price, condition, location
  await page.waitForTimeout(700)
  await axeStep(page, 'producto-step3', vp)
  await page.locator('input[placeholder="5000"]').fill('5000')
  await page.locator('[role="radio"]').first().click()
  // department select (radix)
  const deptTrigger = page.locator('button[role="combobox"]').first()
  await deptTrigger.click()
  await page.waitForTimeout(500)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(400)
  const city = page.locator('input[placeholder*="La Paz"]')
  if (await city.count()) await city.first().fill('La Paz')
  await page.waitForTimeout(400)
  await next(page)

  // step 4: review
  await page.waitForTimeout(900)
  await axeStep(page, 'producto-step4-revisar', vp)

  // ---------- DEMANDA ----------
  await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 20_000 })
  await page.waitForTimeout(1500)
  log(`\n===== DEMANDA [${vp}] =====`)
  await axeStep(page, 'demanda-step1', vp)
  await next(page)
  await axeStep(page, 'demanda-step1-errores', vp)

  await page.locator('#title').fill('Busco iphone de prueba')
  await page.locator('[role="radio"]').first().click()
  await page.waitForTimeout(600)
  await next(page)

  await page.waitForTimeout(700)
  await axeStep(page, 'demanda-step2', vp)
  await page.locator('#description').fill('Descripcion de prueba para el barrido de auditoria de accesibilidad del formulario.')
  await next(page)

  await page.waitForTimeout(700)
  await axeStep(page, 'demanda-step3', vp)
  await page.locator('#price_min').fill('100')
  await page.locator('#price_max').fill('5000')
  const deptTrigger2 = page.locator('button[role="combobox"]').first()
  await deptTrigger2.click()
  await page.waitForTimeout(500)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(400)
  const city2 = page.locator('input[id*="city"], input[placeholder*="La Paz"]')
  if (await city2.count()) await city2.first().fill('La Paz')
  await page.waitForTimeout(400)
  await next(page)

  await page.waitForTimeout(900)
  await axeStep(page, 'demanda-step4-revisar', vp)

  await ctx.close()
}
await browser.close()
log('\nSTEPTHROUGH DONE')
