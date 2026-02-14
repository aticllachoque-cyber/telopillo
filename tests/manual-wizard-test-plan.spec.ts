/**
 * Manual Test Plan: Product Wizard + Mobile Pages
 * Follows exact steps from Phase A through D.
 * Run: npx playwright test tests/manual-wizard-test-plan.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT = path.join(process.cwd(), 'test-screenshots', 'manual-test-plan')
const REPORT: string[] = []

function log(msg: string) {
  REPORT.push(msg)
  console.log(msg)
}

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true })
})

test.describe('Phase A: Login', () => {
  test('A1-A7: Login flow', async ({ page }) => {
    log('\n=== PHASE A: LOGIN ===\n')
    await page.goto('/login')
    await page.screenshot({ path: path.join(OUT, 'A1-login-page.png') })
    log('A1: Navigated to /login')
    log('A2: Snapshot - Login page loaded')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitBtn = page.locator('form button[type="submit"]')

    await emailInput.fill('dev@telopillo.test')
    await passwordInput.fill('DevTest123')
    log('A3-A4: Filled email and password')

    await submitBtn.click()
    log('A5: Clicked Iniciar Sesión')

    await page.waitForTimeout(3000)
    log('A6: Waited 3 seconds')

    const hasAvatar = await page
      .locator('[class*="avatar"], [class*="Avatar"], .rounded-full')
      .first()
      .isVisible()
    const url = page.url()
    log(`A7: Snapshot - URL: ${url}, Avatar visible: ${hasAvatar}`)
    await page.screenshot({ path: path.join(OUT, 'A7-after-login.png') })
    expect(url).not.toContain('/login')
  })
})

test.describe('Phase B: Desktop Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'dev@telopillo.test')
    await page.fill('input[type="password"]', 'DevTest123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 })
  })

  test('B1-B3: Navigate to publicar', async ({ page }) => {
    log('\n=== PHASE B: DESKTOP WIZARD ===\n')
    await page.goto('/publicar')
    await page.waitForTimeout(2000)
    await page.waitForSelector('h2:has-text("Información Básica")', { timeout: 10000 })
    await page.screenshot({ path: path.join(OUT, 'B3-publicar-step1.png'), fullPage: true })

    const stepper = await page.locator('ol.hidden.sm\\:flex, .sm\\:hidden').first().isVisible()
    const formFields = await page.locator('#title, #description, [id="category"]').count()
    log(`B3: Stepper visible: ${stepper}, Form fields: ${formFields}`)
  })

  test('B4-B9: Step 1 fill and snapshot', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')

    const stepperSteps = await page.locator('ol li, .sm\\:hidden button.rounded-full').count()
    log(`B4: Stepper steps/dots: ${stepperSteps}`)

    const catSelect = page.locator('[id="category"]').first()
    const subcatSelect = page.locator('[id="subcategory"]').first()
    log(
      `B5: Categoría/Subcategoría present: ${await catSelect.isVisible()}, ${await subcatSelect.isVisible()}`
    )

    await page.locator('#title').fill('Laptop Dell XPS 15 Como Nueva 256GB SSD')
    await page
      .locator('#description')
      .fill(
        'Laptop Dell XPS 15 en excelente estado. Procesador Intel i7 de 11va generación, 16GB RAM, 256GB SSD. Batería con buen rendimiento, pantalla 15.6 pulgadas Full HD.'
      )
    log('B6-B7: Filled title and description')

    await page.getByRole('combobox').first().click()
    await page
      .getByRole('option', { name: /electrónica|tecnología/i })
      .first()
      .click()
    log('B8: Selected category')

    await page.screenshot({ path: path.join(OUT, 'B9-step1-filled.png'), fullPage: true })
    log('B9: Snapshot after filling Step 1')
  })

  test('B10-B12: Navigate to Step 2', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.locator('#title').fill('Laptop Dell XPS 15 Como Nueva 256GB SSD')
    await page
      .locator('#description')
      .fill(
        'Laptop Dell XPS 15 en excelente estado. Procesador Intel i7 de 11va generación, 16GB RAM, 256GB SSD. Batería con buen rendimiento, pantalla 15.6 pulgadas Full HD.'
      )
    await page.getByRole('combobox').first().click()
    await page
      .getByRole('option', { name: /electrónica|tecnología/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForTimeout(1000)

    const step2Visible = await page.locator('h2:has-text("Detalles del Producto")').isVisible()
    const priceField = await page.locator('#price').isVisible()
    const conditionRadios = await page.locator('input[type="radio"], [role="radio"]').count()
    const deptSelect = await page.locator('#location_department').isVisible()
    log(
      `B12: Advanced to Step 2: ${step2Visible}, Price: ${priceField}, Condition radios: ${conditionRadios}, Dept: ${deptSelect}`
    )
    await page.screenshot({ path: path.join(OUT, 'B12-step2.png'), fullPage: true })
  })

  test('B13-B17: Step 2 fill and snapshot', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.locator('#title').fill('Laptop Dell XPS 15')
    await page
      .locator('#description')
      .fill(
        'Laptop Dell XPS 15 en excelente estado. Procesador Intel i7, 16GB RAM, 256GB SSD. Batería con buen rendimiento, pantalla 15.6 pulgadas Full HD.'
      )
    await page.getByRole('combobox').first().click()
    await page
      .getByRole('option', { name: /electrónica|tecnología/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')

    await page.locator('#price').fill('7500')
    await page.locator('#condition-used_like_new').click()
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.locator('#location_city').fill('La Paz')
    log('B13-B16: Filled price, condition, department, city')
    await page.screenshot({ path: path.join(OUT, 'B17-step2-filled.png'), fullPage: true })
    log('B17: Snapshot after filling Step 2')
  })

  test('B18-B20: Navigate to Step 3', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.locator('#title').fill('Laptop Dell XPS 15')
    await page
      .locator('#description')
      .fill(
        'Laptop Dell XPS 15 en excelente estado. Procesador Intel i7, 16GB RAM, 256GB SSD. Batería con buen rendimiento, pantalla 15.6 pulgadas Full HD.'
      )
    await page.getByRole('combobox').first().click()
    await page
      .getByRole('option', { name: /electrónica|tecnología/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')
    await page.locator('#price').fill('7500')
    await page.locator('#condition-used_like_new').click()
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForTimeout(1000)

    const step3Visible = await page.locator('h2:has-text("Fotos del Producto")').isVisible()
    const uploadZone = await page
      .locator('input[type="file"], [class*="upload"], [class*="border-dashed"]')
      .first()
      .isVisible()
    const tipsVisible = await page.locator('text=Tips para buenas fotos').isVisible()
    log(`B20: Step 3 visible: ${step3Visible}, Upload zone: ${uploadZone}, Tips: ${tipsVisible}`)
    await page.screenshot({ path: path.join(OUT, 'B20-step3.png'), fullPage: true })
  })

  test('B21-B23: Navigate to Step 4 (skip images)', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.locator('#title').fill('Laptop Dell XPS 15')
    await page
      .locator('#description')
      .fill(
        'Laptop Dell XPS 15 en excelente estado. Procesador Intel i7, 16GB RAM, 256GB SSD. Batería con buen rendimiento, pantalla 15.6 pulgadas Full HD.'
      )
    await page.getByRole('combobox').first().click()
    await page
      .getByRole('option', { name: /electrónica|tecnología/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')
    await page.locator('#price').fill('7500')
    await page.locator('#condition-used_like_new').click()
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Fotos del Producto")')
    // Upload a tiny image to pass validation
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer })
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForTimeout(1000)

    const step4Visible = await page.locator('h2:has-text("Revisar y Publicar")').isVisible()
    const editHints = await page.locator('text=Algo no está bien').isVisible()
    const previewCard = await page
      .locator('text=Sin título, text=Bs 7500')
      .first()
      .isVisible()
      .catch(() => false)
    log(`B23: Step 4 visible: ${step4Visible}, Edit hints: ${editHints}, Preview: ${previewCard}`)
    await page.screenshot({ path: path.join(OUT, 'B23-step4.png'), fullPage: true })
  })
})

test.describe('Phase C: Mobile Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'dev@telopillo.test')
    await page.fill('input[type="password"]', 'DevTest123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 })
  })

  test('C1-C4: Mobile layout', async ({ page }) => {
    log('\n=== PHASE C: MOBILE TEST ===\n')
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/publicar')
    await page.waitForTimeout(2000)
    await page.waitForSelector('h2:has-text("Información Básica")', { timeout: 10000 })

    const pasoText = await page.locator('text=Paso 1 de 4').isVisible()
    const progressBar = await page
      .locator('[role="progressbar"], .bg-primary.h-2')
      .first()
      .isVisible()
    const dots = await page.locator('.sm\\:hidden button.rounded-full').count()
    const dotsBox = await page.locator('.sm\\:hidden button.rounded-full').first().boundingBox()
    const singleCol = (await page.locator('.sm\\:grid-cols-2').count()) === 0
    log(
      `C4: Paso 1 de 4: ${pasoText}, Progress bar: ${progressBar}, Dots: ${dots}, Dot size: ${dotsBox ? `${Math.round(dotsBox.width)}x${Math.round(dotsBox.height)}` : 'N/A'}, Single column: ${singleCol}`
    )
    await page.screenshot({ path: path.join(OUT, 'C4-mobile-step1.png'), fullPage: true })
  })

  test('C5-C6: Mobile validation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForTimeout(1000)

    const errors = await page.locator('.text-destructive, [aria-invalid="true"]').count()
    log(`C6: Validation errors visible: ${errors}`)
    await page.screenshot({ path: path.join(OUT, 'C6-mobile-validation.png'), fullPage: true })
  })
})

test.describe('Phase D: Other Pages Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'dev@telopillo.test')
    await page.fill('input[type="password"]', 'DevTest123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 })
  })

  test('D1-D4: Mis productos / productos', async ({ page }) => {
    log('\n=== PHASE D: OTHER PAGES MOBILE ===\n')
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/perfil/mis-productos')
    await page.waitForTimeout(2000)

    const url = page.url()
    const hasContent = (await page.locator('body').count()) > 0
    log(`D4: URL: ${url}, Page loaded: ${hasContent}`)
    await page.screenshot({ path: path.join(OUT, 'D4-mis-productos.png'), fullPage: true })
  })

  test('D5-D6: Product detail or productos', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Try mis-productos first, then click a product link if any, else go to home
    await page.goto('/perfil/mis-productos')
    await page.waitForTimeout(1000)
    const productLink = page.locator('a[href*="/productos/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await page.waitForTimeout(2000)
    } else {
      await page.goto('/')
    }
    await page.waitForTimeout(2000)

    const url = page.url()
    const hasContent = (await page.locator('body').count()) > 0
    log(`D6: URL: ${url}, Page loaded: ${hasContent}`)
    await page.screenshot({ path: path.join(OUT, 'D6-productos.png'), fullPage: true })
  })
})

test.afterAll(() => {
  fs.writeFileSync(path.join(OUT, 'REPORT.txt'), REPORT.join('\n'))
  console.log('\nReport saved to:', path.join(OUT, 'REPORT.txt'))
})
