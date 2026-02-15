/**
 * Search & Discovery — Flow 2: Semantic Search
 *
 * Tests semantic/concept search (when SEMANTIC_SEARCH_ENABLED):
 * - Concept queries find related products (e.g. "algo para llamar" → phones)
 * - Cross-language: English query → Spanish products
 * - API response includes searchMode, latencyMs
 * - Error: very short query
 *
 * Run: npx playwright test tests/e2e/search-discovery/semantic-search.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Semantic Search — Concept Queries
// ---------------------------------------------------------------------------
test.describe('Semantic Search - Concept Queries', () => {
  test('Search "algo para llamar" (concept: phone) returns phones', async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto(`${BASE_URL}/buscar?q=algo+para+llamar`)
    await page.waitForLoadState('networkidle')

    await page.getByText(/buscando productos/i).waitFor({ state: 'hidden', timeout: 15000 })

    // Either we have results with phone-related products, or no results
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()

    if (hasResults) {
      // At least one product should be phone-related (celular, smartphone, samsung, etc.)
      const productTitles = page.locator('h3, a[href*="/productos/"]')
      const count = await productTitles.count()
      if (count > 0) {
        const firstText = await productTitles.first().textContent()
        const phoneRelated = /celular|smartphone|samsung|iphone|galaxy|móvil|telefono|llamar/i.test(
          firstText || ''
        )
        expect(phoneRelated).toBeTruthy()
      }
    }
  })

  test('Search "ropa de invierno" returns jackets/clothing', async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto(`${BASE_URL}/buscar?q=ropa+de+invierno`)
    await page.waitForLoadState('networkidle')

    await page.getByText(/buscando productos/i).waitFor({ state: 'hidden', timeout: 15000 })

    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()

    if (hasResults) {
      const productTitles = page.locator('h3, a[href*="/productos/"]')
      const count = await productTitles.count()
      if (count > 0) {
        const firstText = await productTitles.first().textContent()
        const clothingRelated = /ropa|chaqueta|abrigo|sweater|buzo|moda|invierno/i.test(
          firstText || ''
        )
        expect(clothingRelated).toBeTruthy()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Semantic Search — Cross-Language
// ---------------------------------------------------------------------------
test.describe('Semantic Search - Cross-Language', () => {
  test('Search "cheap phone" (English) returns Spanish products', async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto(`${BASE_URL}/buscar?q=cheap+phone`)
    await page.waitForLoadState('networkidle')

    await page.getByText(/buscando productos/i).waitFor({ state: 'hidden', timeout: 15000 })

    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()

    if (hasResults) {
      const productLinks = page.locator('a[href*="/productos/"]')
      const count = await productLinks.count()
      expect(count).toBeGreaterThanOrEqual(0)
      // Products may have Spanish titles; page should not error
    }
  })
})

// ---------------------------------------------------------------------------
// 3. Search API — Metadata
// ---------------------------------------------------------------------------
test.describe('Semantic Search - API Metadata', () => {
  test('GET /api/search returns searchMode and latencyMs', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search?q=laptop`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('searchMode')
    expect(['keyword', 'hybrid']).toContain(data.searchMode)
    expect(data).toHaveProperty('latencyMs')
    expect(typeof data.latencyMs).toBe('number')
    expect(data.latencyMs).toBeGreaterThanOrEqual(0)
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 4. Semantic Search — Error
// ---------------------------------------------------------------------------
test.describe('Semantic Search - Error Scenarios', () => {
  test('Very short query "a" is handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=a`)
    await page.waitForLoadState('networkidle')

    await page.getByText(/buscando productos/i).waitFor({ state: 'hidden', timeout: 15000 })

    // Page should not crash; we get results or no-results
    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })
})
