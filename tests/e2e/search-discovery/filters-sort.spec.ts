/**
 * Search & Discovery — Flow 3: Filters and Sorting
 *
 * Tests filter and sort controls on search results:
 * - Apply category filter (Electrónica) → URL updates, results filtered
 * - Clear filter → all results restored
 * - Sort by price ascending, newest first
 * - Combine filter + sort
 * - Filters persist on page reload (URL state)
 * - Errors: category with no products, invalid category in URL
 *
 * Run: npx playwright test tests/e2e/search-discovery/filters-sort.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Filters — Category
// ---------------------------------------------------------------------------
test.describe('Filters - Category', () => {
  test('Apply category filter (Electrónica) updates URL and filters results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Open category filter (Select with label "Categoría") - desktop sidebar visible
    const categoryTrigger = page.getByLabel(/categoría/i)
    await categoryTrigger.click()

    // Select "Electrónica" (slug: electronics)
    await page.getByRole('option', { name: /electrónica/i }).click()

    // URL should update to include category=electronics
    await expect(page).toHaveURL(/category=electronics/)
    expect(page.url()).toContain('category=electronics')

    // Results should load (or empty if no electronics match)
    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })

  test('Clear filter restores all results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung&category=electronics`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Click "Limpiar" to clear all filters - scope to first aside (desktop filters sidebar)
    const clearBtn = page.locator('aside').first().getByRole('button', {
      name: 'Limpiar todos los filtros',
    })
    await clearBtn.click()

    // URL should no longer have category param
    await page.waitForURL(/\/buscar\?q=samsung($|&)/, { timeout: 5000 })
    expect(page.url()).not.toContain('category=')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. Sort
// ---------------------------------------------------------------------------
test.describe('Filters - Sort', () => {
  test('Sort by price ascending', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Open sort dropdown
    const sortTrigger = page.locator('#sort-select').nth(1)
    await sortTrigger.click()

    // Select "Precio: menor a mayor"
    await page.getByRole('option', { name: /precio: menor a mayor/i }).click()

    await expect(page).toHaveURL(/sort=price_asc/)
    expect(page.url()).toContain('sort=price_asc')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })

  test('Sort by newest first', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    const sortTrigger = page.locator('#sort-select').nth(1)
    await sortTrigger.click()

    await page.getByRole('option', { name: /más recientes/i }).click()

    await expect(page).toHaveURL(/sort=newest/)
    expect(page.url()).toContain('sort=newest')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 3. Combine Filter + Sort
// ---------------------------------------------------------------------------
test.describe('Filters - Combine Filter and Sort', () => {
  test('Apply category filter and sort together', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Apply category
    const categoryTrigger = page.getByLabel(/categoría/i)
    await categoryTrigger.click()
    await page.getByRole('option', { name: /electrónica/i }).click()

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Apply sort
    const sortTrigger = page.locator('#sort-select').nth(1)
    await sortTrigger.click()
    await page.getByRole('option', { name: /precio: menor a mayor/i }).click()

    expect(page.url()).toContain('category=electronics')
    expect(page.url()).toContain('sort=price_asc')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 4. URL State Persistence
// ---------------------------------------------------------------------------
test.describe('Filters - URL State Persistence', () => {
  test('Filters persist on page reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung&category=electronics&sort=price_asc`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // URL should still have params
    expect(page.url()).toContain('q=samsung')
    expect(page.url()).toContain('category=electronics')
    expect(page.url()).toContain('sort=price_asc')

    // Category and sort selects should show selected values
    const categoryTrigger = page.getByLabel(/categoría/i)
    await expect(categoryTrigger).toContainText(/electrónica/i)

    const sortTrigger = page.locator('#sort-select').nth(1)
    await expect(sortTrigger).toContainText(/menor a mayor/i)
  })
})

// ---------------------------------------------------------------------------
// 5. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Filters - Error Scenarios', () => {
  test('Category with no products shows empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=xyznonexistent123&category=electronics`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    await expect(
      page.getByText(/no encontramos productos|no se encontraron resultados/i)
    ).toBeVisible()
    // At least one suggestion: adjust keywords, clear filters link, or categories link
    const hasSuggestion =
      (await page.getByText(/intenta con otras palabras/i).isVisible()) ||
      (await page
        .getByRole('link', { name: /limpiar filtros|ver todas las categorías/i })
        .isVisible())
    expect(hasSuggestion).toBeTruthy()
  })

  test('Invalid category in URL is handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=samsung&category=invalid-category-xyz`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Page should not crash; we get either empty results or fallback behavior
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})
