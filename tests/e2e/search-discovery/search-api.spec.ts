/**
 * Search & Discovery — Flow 5: Search API Direct Tests
 *
 * Uses Playwright request context (not page) to test the search API:
 * - GET /api/search?q=... → valid JSON with products array
 * - Category, combined query+category, sellerType filters
 * - Empty query handling
 * - Product shape: id, title, price, category, images, seller_name, seller_verification_level
 * - Errors: invalid page, SQL injection, extremely long query
 *
 * Run: npx playwright test tests/e2e/search-discovery/search-api.spec.ts
 */
import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// 1. Search API — Happy Path
// ---------------------------------------------------------------------------
test.describe('Search API - Happy Path', () => {
  test('GET /api/search?q=samsung returns valid JSON with products array', async ({ request }) => {
    const response = await request.get('/api/search?q=samsung')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
    expect(data).toHaveProperty('totalCount')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('totalPages')
    expect(data).toHaveProperty('hasMore')
  })

  test('GET /api/search?category=electronics returns filtered results', async ({ request }) => {
    const response = await request.get('/api/search?category=electronics')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()

    // All returned products should have category electronics
    for (const p of data.products) {
      expect(p.category).toBe('electronics')
    }
  })

  test('GET /api/search?q=samsung&category=electronics returns combined results', async ({
    request,
  }) => {
    const response = await request.get('/api/search?q=samsung&category=electronics')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()

    for (const p of data.products) {
      expect(p.category).toBe('electronics')
    }
  })

  test('GET /api/search?sellerType=business returns filtered results', async ({ request }) => {
    const response = await request.get('/api/search?sellerType=business')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()

    // When products exist, each has seller fields
    for (const p of data.products as Record<string, unknown>[]) {
      expect(p).toHaveProperty('seller_name')
      expect(p).toHaveProperty('seller_verification_level')
    }
  })

  test('GET /api/search with empty query returns all products or empty', async ({ request }) => {
    const response = await request.get('/api/search')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
    expect(data).toHaveProperty('totalCount')
    expect(typeof data.totalCount).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// 2. Search API — Product Shape
// ---------------------------------------------------------------------------
test.describe('Search API - Product Shape', () => {
  test('Each product has required fields', async ({ request }) => {
    const response = await request.get('/api/search?q=samsung&limit=5')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    const products = data.products as unknown[]

    if (products.length > 0) {
      const product = products[0] as Record<string, unknown>
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('title')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('category')
      expect(product).toHaveProperty('images')
      expect(Array.isArray(product.images)).toBeTruthy()
      expect(product).toHaveProperty('seller_name')
      expect(product).toHaveProperty('seller_verification_level')
      expect(typeof product.seller_verification_level).toBe('number')
    }
  })
})

// ---------------------------------------------------------------------------
// 3. Search API — Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Search API - Error Scenarios', () => {
  test('Invalid page number is handled', async ({ request }) => {
    const response = await request.get('/api/search?q=samsung&page=-1')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(data).toHaveProperty('page')
    // API normalizes page to >= 1
    expect(data.page).toBeGreaterThanOrEqual(1)
  })

  test('SQL injection in query is sanitized', async ({ request }) => {
    const maliciousQuery = "'; DROP TABLE products; --"
    const response = await request.get(`/api/search?q=${encodeURIComponent(maliciousQuery)}`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBeTruthy()
    // Should not return 500; either empty results or safe handling
  })

  test('Extremely long query is handled', async ({ request }) => {
    const longQuery = 'a'.repeat(2000)
    const response = await request.get(`/api/search?q=${encodeURIComponent(longQuery)}`)
    // Should not return 500; may return 400 or empty results
    expect([200, 400]).toContain(response.status())

    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('products')
      expect(Array.isArray(data.products)).toBeTruthy()
    }
  })
})
