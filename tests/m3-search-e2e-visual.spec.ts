/**
 * M3 Search & Discovery - Complete E2E Visual Test
 * Screenshot at EVERY step for full flow visibility.
 * Run: npx playwright test tests/m3-search-e2e-visual.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT = path.join(process.cwd(), 'test-screenshots', 'm3-search-e2e')

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true })
})

test.describe('M3 Search & Discovery E2E Visual', () => {
  test('Complete flow with screenshot at every step', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 1280, height: 800 })

    // ========== Step 1: Homepage ==========
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: path.join(OUT, '01-homepage-header-search.png'),
      fullPage: false,
    })
    const headerSearch = await page
      .locator('header')
      .getByPlaceholder('Buscar productos...')
      .isVisible()
    expect(headerSearch).toBeTruthy()

    // ========== Step 2: Categories page ==========
    await page.getByRole('link', { name: 'Categorías' }).first().click()
    await page.waitForURL(/\/categorias/)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, '02-categorias-page.png'), fullPage: true })
    const categoryCards = await page.locator('a[href*="/buscar?category="]').count()
    expect(categoryCards).toBeGreaterThanOrEqual(9)

    // ========== Step 3: Category filter (Electrónica) ==========
    await page
      .getByRole('link', { name: /Electrónica/ })
      .first()
      .click()
    await page.waitForURL(/\/buscar\?category=electronics/)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '03-buscar-category-electronics.png'),
      fullPage: true,
    })

    // ========== Step 4: Search from header ==========
    const headerSearchInput = page.locator('header').getByPlaceholder('Buscar productos...')
    await headerSearchInput.click()
    await headerSearchInput.fill('')
    await headerSearchInput.fill('samsung')
    await page.locator('header').getByRole('button', { name: 'Buscar' }).click()
    await page.waitForURL(/\/buscar.*q=samsung/)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, '04-search-samsung-results.png'), fullPage: true })

    // ========== Step 5: Sort by price desc ==========
    // Desktop sort is second in DOM (mobile first, hidden on lg)
    await page.locator('#sort-select').nth(1).click()
    await page.getByRole('option', { name: 'Precio: mayor a menor' }).click()
    await page.waitForURL(/sort=price_desc/)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, '05-sort-price-desc.png'), fullPage: true })

    // ========== Step 6: Empty search ==========
    await page.locator('header').getByPlaceholder('Buscar productos...').fill('xyznonexistent123')
    await page.locator('header').getByRole('button', { name: 'Buscar' }).click()
    await page.waitForURL(/q=xyznonexistent123/)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, '06-empty-no-results.png'), fullPage: true })

    // ========== Step 7: Browse all with no query ==========
    // With no query or filters, /buscar now shows all products (bug fix: no false empty prompt)
    await page.goto('/buscar')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, '07-buscar-all-products.png'), fullPage: true })
    // Empty prompt should NOT appear when results exist
    await expect(page.getByText('¿Qué estás buscando?')).not.toBeVisible()
    // Should show results instead
    await expect(page.getByText(/resultado/)).toBeVisible()

    // ========== Step 8: Mobile view ==========
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/buscar?q=samsung')
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, '08-mobile-search-results.png'), fullPage: true })

    // Click Filtros button
    await page.getByRole('button', { name: 'Filtros' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(OUT, '09-mobile-filters-panel.png'), fullPage: true })
  })
})
