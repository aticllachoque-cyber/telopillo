import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-screenshots', 'product-wizard')

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
})

test.describe('Product Form Wizard UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'dev@telopillo.test')
    await page.fill('input[type="password"]', 'DevTest123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(?!login)/, { timeout: 10000 })
  })

  test('01 - Landing page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-landing.png') })
  })

  test('02 - Step 1 Basic Info', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")', { timeout: 10000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-step1-basic-info.png'),
      fullPage: true,
    })
  })

  test('03 - Step 2 Details', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page
      .getByRole('textbox', { name: 'Título del Producto *' })
      .fill('iPhone 13 Pro Max 256GB - Test')
    await page
      .getByRole('textbox', { name: 'Descripción *' })
      .fill(
        'Producto de prueba para test visual. Estado excelente, incluye cargador original y funda.'
      )
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")', { timeout: 5000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-step2-details.png'),
      fullPage: true,
    })
  })

  test('04 - Step 3 Photos', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page
      .getByRole('textbox', { name: 'Título del Producto *' })
      .fill('iPhone 13 Pro Max 256GB')
    await page
      .getByRole('textbox', { name: 'Descripción *' })
      .fill('Producto de prueba. Estado excelente, incluye cargador original y funda de regalo.')
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')
    await page.locator('#price').fill('5000')
    await page.locator('#condition-new').click()
    await page.locator('#location_city').fill('La Paz')
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Fotos del Producto")', { timeout: 5000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-step3-photos.png'),
      fullPage: true,
    })
  })

  test('05 - Step 4 Review', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page
      .getByRole('textbox', { name: 'Título del Producto *' })
      .fill('iPhone 13 Pro Max 256GB')
    await page
      .getByRole('textbox', { name: 'Descripción *' })
      .fill('Producto de prueba. Estado excelente, incluye cargador original y funda de regalo.')
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')
    await page.locator('#price').fill('5000')
    await page.locator('#condition-new').click()
    await page.locator('#location_city').fill('La Paz')
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Fotos del Producto")')
    // Upload a test image (1x1 PNG)
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer,
    })
    await page.waitForTimeout(2000) // Wait for upload
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Revisar y Publicar")', { timeout: 5000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-step4-review.png'),
      fullPage: true,
    })
  })

  test('06 - Mobile Step 1', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")', { timeout: 10000 })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-mobile-step1.png'),
      fullPage: true,
    })
  })

  test('07 - Mobile Step 2', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/publicar')
    await page.waitForSelector('h2:has-text("Información Básica")')
    await page.getByRole('textbox', { name: 'Título del Producto *' }).fill('iPhone 13 Pro Max')
    await page
      .getByRole('textbox', { name: 'Descripción *' })
      .fill('Producto de prueba. Estado excelente, incluye cargador original.')
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await page.waitForSelector('h2:has-text("Detalles del Producto")')
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-mobile-step2.png'),
      fullPage: true,
    })
  })
})
