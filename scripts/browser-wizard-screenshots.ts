/**
 * Captures Product Form Wizard screenshots and logs observations.
 * Run: npx tsx scripts/browser-wizard-screenshots.ts
 */
import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE = 'http://localhost:3000'
const OUT = path.join(process.cwd(), 'test-screenshots', 'wizard-browser')

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  const log: string[] = []
  const observe = (msg: string) => {
    log.push(msg)
    console.log(msg)
  }

  try {
    // 1. Navigate to login
    observe('\n=== 1. Navigate to /login ===')
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(OUT, '01-login.png') })
    const loginForm = await page.locator('form').count()
    observe(`Login form present: ${loginForm > 0}`)
    const emailInput = await page.locator('input[type="email"]').count()
    const passInput = await page.locator('input[type="password"]').count()
    observe(`Email input: ${emailInput}, Password input: ${passInput}`)

    // 2. Fill and submit
    observe('\n=== 2. Fill credentials and submit ===')
    await page.fill('input[type="email"]', 'dev@telopillo.test')
    await page.fill('input[type="password"]', 'DevTest123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 })
    observe('Login successful, redirected')

    // 3. Wait and go to publicar
    await page.waitForTimeout(3000)
    observe('\n=== 3. Navigate to /publicar ===')
    await page.goto(`${BASE}/publicar`, { waitUntil: 'networkidle' })
    await page.waitForSelector('h2:has-text("Información Básica")', { timeout: 10000 })

    // 4. Desktop Step 1 snapshot
    observe('\n=== 4. Desktop Step 1 - Snapshot ===')
    const step1Title = await page.locator('h2:has-text("Información Básica")').isVisible()
    const step1Fields = await page.locator('#title, #description, [id="category"]').count()
    const stepperDesktop = await page.locator('ol.hidden.sm\\:flex').isVisible()
    const siguienteVisible = await page.locator('button:has-text("Siguiente")').first().isVisible()
    const siguienteBox = siguienteVisible
      ? await page.locator('button:has-text("Siguiente")').first().boundingBox()
      : null
    observe(`Step 1 title visible: ${step1Title}`)
    observe(`Form fields (title, desc, category): ${step1Fields}`)
    observe(`Desktop stepper visible: ${stepperDesktop}`)
    observe(`Siguiente button visible: ${siguienteVisible}`)
    if (siguienteBox)
      observe(
        `Siguiente size: ${Math.round(siguienteBox.width)}x${Math.round(siguienteBox.height)}px`
      )
    await page.screenshot({ path: path.join(OUT, '02-desktop-step1.png'), fullPage: true })

    // 5. Resize to mobile
    observe('\n=== 5. Resize to 375x812 (mobile) ===')
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    const mobileStepper = await page.locator('.sm\\:hidden').first().isVisible()
    const pasoText = await page.locator('text=Paso 1 de 4').isVisible()
    const dots = await page.locator('.sm\\:hidden button.rounded-full').count()
    observe(`Mobile stepper visible: ${mobileStepper}`)
    observe(`"Paso 1 de 4" visible: ${pasoText}`)
    observe(`Step dots (44px min): ${dots}`)
    const siguienteMobile = await page.locator('button:has-text("Siguiente")').first().boundingBox()
    if (siguienteMobile)
      observe(
        `Siguiente (mobile) size: ${Math.round(siguienteMobile.width)}x${Math.round(siguienteMobile.height)}px`
      )
    await page.screenshot({ path: path.join(OUT, '03-mobile-step1.png'), fullPage: true })

    // 6. Click Siguiente (may fail validation)
    observe('\n=== 6. Click Siguiente (validation may block) ===')
    await page.locator('button:has-text("Siguiente")').first().click()
    await page.waitForTimeout(1500)
    const stillStep1 = await page.locator('h2:has-text("Información Básica")').isVisible()
    const validationErrors = await page.locator('.text-destructive, [role="alert"]').count()
    const step2Visible = await page.locator('h2:has-text("Detalles del Producto")').isVisible()
    observe(`Still on Step 1: ${stillStep1}`)
    observe(`Validation errors shown: ${validationErrors}`)
    observe(`Step 2 visible: ${step2Visible}`)
    await page.screenshot({ path: path.join(OUT, '04-after-siguiente-click.png'), fullPage: true })

    // Write report
    fs.writeFileSync(path.join(OUT, 'OBSERVATIONS.txt'), log.join('\n'))
    console.log('\nScreenshots and report saved to:', OUT)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
