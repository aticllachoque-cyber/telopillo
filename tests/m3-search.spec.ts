/**
 * M3 Search Functionality Test
 * Run: npx playwright test tests/m3-search.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT = path.join(process.cwd(), 'test-screenshots', 'm3-search')

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true })
})

test.describe('M3 Search Functionality', () => {
  test('Search flow: type samsung, submit, verify results', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 2. Find search bar in header (desktop - md breakpoint)
    // Header SearchBar has placeholder "Buscar productos..."; hero has "Ej: iPhone, moto..."
    await page.setViewportSize({ width: 1280, height: 800 })
    const searchBar = page.locator('header').getByPlaceholder('Buscar productos...')
    const searchBarVisible = await searchBar.isVisible()
    expect(searchBarVisible).toBeTruthy()

    // 3. Type "samsung"
    await searchBar.fill('samsung')

    // 4. Click search button in header
    await page.locator('header').getByRole('button', { name: 'Buscar' }).click()

    // 5. Verify redirect to /buscar?q=samsung
    await page.waitForURL(/\/buscar\?q=samsung/, { timeout: 5000 })
    expect(page.url()).toContain('/buscar?q=samsung')

    // 6. Wait for loading to finish (spinner/text disappears)
    await page.waitForSelector('text=Buscando productos...', { state: 'hidden', timeout: 15000 })
    await page.waitForTimeout(500)

    // 7. Screenshot
    await page.screenshot({ path: path.join(OUT, '01-search-results-samsung.png'), fullPage: true })

    // Verify we got either results, no-results state, or results count
    const hasResults = await page
      .locator('a[href*="/productos/"]')
      .first()
      .isVisible()
      .catch(() => false)
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
      .catch(() => false)
    const hasCount = await page
      .getByText(/resultado/i)
      .isVisible()
      .catch(() => false)
    expect(hasResults || hasNoResults || hasCount).toBeTruthy()
  })

  test('Empty state at /buscar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/buscar')
    await page.waitForLoadState('networkidle')

    // Verify empty state elements
    const emptyTitle = await page.getByText('¿Qué estás buscando?').isVisible()
    const emptyDesc = await page.getByText(/usa la barra de búsqueda/i).isVisible()
    const categoriesLink = await page
      .getByRole('link', { name: /explora por categorías|O explora por categorías/i })
      .isVisible()

    expect(emptyTitle).toBeTruthy()
    expect(emptyDesc || categoriesLink).toBeTruthy()

    await page.screenshot({ path: path.join(OUT, '02-empty-state.png'), fullPage: true })
  })
})
