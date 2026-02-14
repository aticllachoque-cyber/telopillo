/**
 * Verify Bug 1 and Bug 2 fixes in search UI
 * Run: npx playwright test tests/bug-fixes-verification.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT = path.join(process.cwd(), 'test-screenshots', 'bug-fixes-verification')

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true })
})

test.describe('Bug Fix Verification', () => {
  test('Bug 1: Empty state not shown when results exist', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    // Navigate to /buscar (no query params)
    await page.goto('/buscar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Should show results WITHOUT "¿Qué estás buscando?" empty prompt
    const emptyPrompt = await page.getByText('¿Qué estás buscando?').isVisible()
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasProductCards = await page
      .locator('a[href*="/productos/"]')
      .first()
      .isVisible()
      .catch(() => false)

    await page.screenshot({ path: path.join(OUT, '01-buscar-no-query.png'), fullPage: true })

    expect(emptyPrompt).toBeFalsy()
    expect(hasResults || hasProductCards).toBeTruthy()

    // Navigate to /buscar?category=electronics
    await page.goto('/buscar?category=electronics')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)

    const emptyPrompt2 = await page.getByText('¿Qué estás buscando?').isVisible()
    const dosResultados = await page.getByText('2 resultados').isVisible()

    await page.screenshot({ path: path.join(OUT, '02-buscar-electronics.png'), fullPage: true })

    expect(emptyPrompt2).toBeFalsy()
    expect(dosResultados).toBeTruthy()
  })

  test('Bug 2: SelectItem - Category dropdown and clear filter', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/buscar?category=electronics')
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)

    // Category dropdown should show "Electrónica"
    const categoryTrigger = page.locator('#filter-category')
    await expect(categoryTrigger).toContainText('Electrónica')

    await page.screenshot({
      path: path.join(OUT, '03-filters-electronics-selected.png'),
      fullPage: true,
    })

    // Click Category dropdown and select "Todas las categorías"
    await categoryTrigger.click()
    await page.getByRole('option', { name: 'Todas las categorías' }).click()

    await page.waitForURL(
      (url) => !url.searchParams.has('category') || url.searchParams.get('category') === ''
    )
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)

    await page.screenshot({ path: path.join(OUT, '04-filters-all-categories.png'), fullPage: true })

    // Should show all products (no category filter)
    const url = page.url()
    expect(url).not.toContain('category=electronics')
  })

  test('Categories page and Vehículos redirect', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    await page.goto('/categorias')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, '05-categorias-page.png'), fullPage: true })

    await page
      .getByRole('link', { name: /Vehículos/ })
      .first()
      .click()
    await page.waitForURL(/\/buscar\?category=vehicles/)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)

    await page.screenshot({ path: path.join(OUT, '06-buscar-vehicles.png'), fullPage: true })

    expect(page.url()).toContain('/buscar?category=vehicles')
  })
})
