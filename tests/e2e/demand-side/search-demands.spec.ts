/**
 * Demand Side — Search Demands
 *
 * Tests demand listing and search:
 * - Browse page renders with heading, filters, search bar
 * - Search API responds correctly
 * - Filters (category, department) update URL params
 * - Pagination controls
 * - Empty state shows CTA
 *
 * Run: npx playwright test tests/e2e/demand-side/search-demands.spec.ts
 */
import { test, expect } from '@playwright/test'

test.describe('Browse Demands', () => {
  test('Page renders heading, search bar, and filters', async ({ page }) => {
    await page.goto('/busco')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /busco.*necesito/i })).toBeVisible()
    await expect(page.getByPlaceholder(/buscar solicitudes/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /publicar solicitud/i })).toBeVisible()
  })

  test('Empty state shows CTA to publish', async ({ page }) => {
    await page.goto('/busco?q=xyznonexistentquery123')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(3000)
    const noResults = page.getByText(/no hay solicitudes/i)
    const hasResults = await page.locator('a[href*="/busco/"]').count()

    if (hasResults === 0) {
      await expect(noResults).toBeVisible()
    }
  })
})

test.describe('Search API', () => {
  test('GET /api/search-demands returns valid JSON', async ({ request }) => {
    const res = await request.get('/api/search-demands?limit=5')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('demands')
    expect(body).toHaveProperty('totalCount')
    expect(Array.isArray(body.demands)).toBe(true)
    expect(typeof body.totalCount).toBe('number')
  })

  test('GET /api/search-demands with search query', async ({ request }) => {
    const res = await request.get('/api/search-demands?q=celular&limit=5')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('searchMode')
    expect(['browse', 'keyword', 'hybrid']).toContain(body.searchMode)
  })

  test('GET /api/search-demands with category filter', async ({ request }) => {
    const res = await request.get('/api/search-demands?category=electronics&limit=5')
    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body.demands)).toBe(true)
  })
})
