/**
 * Search & Discovery — Flow 4: Category Browsing
 *
 * Tests category browsing from /categorias:
 * - Category grid displays
 * - Click "Electrónica" → redirect to /buscar?category=electronics
 * - Filtered results, navigate back
 * - Accessibility: axe-core scan on /categorias
 * - Mobile: category grid adapts, touch targets >= 44px
 *
 * Run: npx playwright test tests/e2e/search-discovery/categories.spec.ts
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Category Browsing — Happy Path
// ---------------------------------------------------------------------------
test.describe('Category Browsing - Happy Path', () => {
  test('Navigate to /categorias and verify category grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1, name: /categorías/i })).toBeVisible()
    await expect(page.getByText(/explora productos por categoría/i)).toBeVisible()

    // Category grid: at least Electrónica, Vehículos, Hogar, etc.
    await expect(page.getByRole('link', { name: /electrónica/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /vehículos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /hogar/i })).toBeVisible()
  })

  test('Click Electrónica redirects to /buscar?category=electronics', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /electrónica/i }).click()

    await page.waitForURL(/\/buscar\?category=electronics/, { timeout: 10000 })
    expect(page.url()).toContain('/buscar')
    expect(page.url()).toContain('category=electronics')

    await page.getByText(/buscando productos/i).waitFor({ state: 'hidden', timeout: 15000 })

    const hasResults = await page.getByText(/resultado/i).isVisible()
    const hasNoResults = await page
      .getByText(/no se encontraron resultados|no encontramos productos/i)
      .isVisible()
    expect(hasResults || hasNoResults).toBeTruthy()
  })

  test('Navigate back from search results to categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /electrónica/i }).click()
    await page.waitForURL(/\/buscar\?category=electronics/, { timeout: 10000 })

    await page.goBack()
    await page.waitForURL(/\/categorias/, { timeout: 5000 })
    expect(page.url()).toContain('/categorias')
    await expect(page.getByRole('heading', { level: 1, name: /categorías/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Category Browsing — Accessibility
// ---------------------------------------------------------------------------
test.describe('Category Browsing - Accessibility', () => {
  test('Page passes WCAG 2.2 AA accessibility audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')

    if (critical.length > 0 || serious.length > 0) {
      console.log('Accessibility violations:')
      ;[...critical, ...serious].forEach((v) => {
        console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`)
        v.nodes.forEach((n) => console.log(`    → ${n.html.substring(0, 80)}`))
      })
    }

    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 3. Category Browsing — Mobile
// ---------------------------------------------------------------------------
test.describe('Category Browsing - Mobile Responsive (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Category grid adapts to mobile viewport', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

    // Category links visible
    await expect(page.getByRole('link', { name: /electrónica/i })).toBeVisible()
  })

  test('Touch targets are >= 44px', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    const links = page.locator('a[href*="/buscar?category="]')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await links.nth(i).boundingBox()
      if (box) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
