/**
 * Search & Discovery — Flow 1: Keyword Search
 *
 * Tests keyword search from homepage and search page:
 * - Navigate to /, type query, submit → results at /buscar?q=...
 * - Search from results page with new query
 * - Error scenarios: non-existent query, empty search, long query, special chars
 *
 * Run: npx playwright test tests/e2e/search-discovery/keyword-search.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Keyword Search — Happy Path
// ---------------------------------------------------------------------------
test.describe('Keyword Search - Happy Path', () => {
  test('Navigate to home, type samsung in search bar, submit and verify results', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    // Header SearchBar (desktop) - same pattern as m3-search
    const searchBar = page.locator('header').getByPlaceholder(/buscar productos/i)
    await searchBar.fill('samsung')
    await page
      .locator('header')
      .getByRole('button', { name: /buscar/i })
      .click()

    await page.waitForURL(/\/buscar\?q=samsung/, { timeout: 10000 })
    expect(page.url()).toContain('/buscar')
    expect(page.url()).toContain('q=samsung')

    // Wait for loading to finish
    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Verify results: either product cards, results count, or no-results state
    const hasProductLinks = await page
      .locator('a[href*="/productos/"]')
      .first()
      .isVisible()
      .catch(() => false)
    const hasResultsCount = await page
      .getByText(/resultado/i)
      .isVisible()
      .catch(() => false)
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
      .catch(() => false)

    expect(hasProductLinks || hasResultsCount || hasNoResults).toBeTruthy()

    if (hasProductLinks) {
      const firstProduct = page.locator('a[href*="/productos/"]').first()
      await expect(firstProduct).toBeVisible()
    }
  })

  test('Search from results page with new query', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // SearchBar in main content (not header)
    const mainSearch = page.locator('#main-content').getByRole('search')
    await mainSearch.getByLabel(/buscar productos/i).fill('laptop')
    await mainSearch.getByRole('button', { name: /buscar/i }).click()

    await page.waitForURL(/\/buscar\?q=laptop/, { timeout: 10000 })
    expect(page.url()).toContain('q=laptop')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    const hasResults = await page
      .getByText(/resultado/i)
      .isVisible()
      .catch(() => false)
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
      .catch(() => false)
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. Keyword Search — Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Keyword Search - Error Scenarios', () => {
  test('Non-existent query shows empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=xyznonexistent123`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 20000 })

    // Empty state: "No encontramos productos" or "No se encontraron resultados"
    const emptyMessage = page.getByText(/no encontramos productos|no se encontraron resultados/i)
    await expect(emptyMessage).toBeVisible({ timeout: 10000 })
    // Suggestion links or text (Limpiar filtros, Ver todas las categorías, Intenta con otras palabras)
    const hasSuggestion =
      (await page
        .getByRole('link', { name: /limpiar filtros|ver todas las categorías/i })
        .isVisible()) || (await page.getByText(/intenta con otras palabras/i).isVisible())
    expect(hasSuggestion).toBeTruthy()
  })

  test('Empty search does not submit from SearchBar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')

    // SearchBar: submit button is disabled when query is empty
    const submitBtn = page.getByRole('button', { name: /buscar/i }).first()
    await expect(submitBtn).toBeDisabled()
  })

  test('Empty search from hero form shows empty state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    // Hero form: submit with empty input - native form may submit to /buscar
    const heroForm = page.locator('form[action="/buscar"]')
    const input = heroForm.getByLabel(/término de búsqueda/i)
    await input.fill('')
    await heroForm.getByRole('button', { name: /buscar/i }).click()

    await page.waitForURL(/\/buscar/, { timeout: 5000 })

    // With no query we see "¿Qué estás buscando?" or results
    const hasEmptyState = await page
      .getByText(/qué estás buscando/i)
      .isVisible()
      .catch(() => false)
    const hasResults = await page
      .getByText(/resultado/i)
      .isVisible()
      .catch(() => false)
    expect(hasEmptyState || hasResults).toBeTruthy()
  })

  test('Long query (500+ chars) is handled gracefully', async ({ page }) => {
    const longQuery = 'a'.repeat(500)
    await page.goto(`${BASE_URL}/buscar?q=${encodeURIComponent(longQuery)}`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Page should not crash; we get either results or no-results state
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    const hasError = await page.getByRole('alert').isVisible()

    expect(hasResults || hasNoResults || hasError).toBeTruthy()
  })

  test('Special characters in query are handled', async ({ page }) => {
    const specialQuery = 'samsung & "galaxy" <test>'
    await page.goto(`${BASE_URL}/buscar?q=${encodeURIComponent(specialQuery)}`)
    await page.waitForLoadState('networkidle')

    await page.locator('text=Buscando productos...').waitFor({ state: 'hidden', timeout: 15000 })

    // Page should not crash; URL should preserve or sanitize query
    expect(page.url()).toContain('/buscar')
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})
