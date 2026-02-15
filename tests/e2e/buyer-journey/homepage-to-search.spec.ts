import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Homepage Hero and Search
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Homepage to Search', () => {
  test('Homepage loads with hero section and search bar', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    // Hero heading
    await expect(page.getByRole('heading', { level: 1, name: /telopillo/i })).toBeVisible()

    // Search form in hero (scope to hero - header also has a search bar)
    const hero = page.getByRole('region', { name: /lo que buscás|telopillo/i })
    const searchForm = hero.getByRole('search', { name: /buscar productos/i })
    await expect(searchForm).toBeVisible()

    // Search input in hero
    await expect(hero.getByLabel(/término de búsqueda/i)).toBeVisible()

    // Search button in hero
    await expect(hero.getByRole('button', { name: /buscar/i })).toBeVisible()
  })

  test('Search from hero redirects to /buscar with query', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const hero = page.getByRole('region', { name: /lo que buscás|telopillo/i })
    const searchInput = hero.getByLabel(/término de búsqueda/i)
    await searchInput.fill('celular')
    await hero.getByRole('button', { name: /buscar/i }).click()

    await page.waitForURL(/\/buscar\?q=celular/, { timeout: 10000 })
    expect(page.url()).toContain('/buscar')
    expect(page.url()).toContain('q=celular')
  })

  test('Search results page shows product cards and retains query', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    // Page heading
    await expect(page.getByRole('heading', { name: /buscar productos/i })).toBeVisible()

    // Search bar retains query (use input directly - getByLabel can match form)
    const searchInput = page.locator('input[type="search"]').first()
    await expect(searchInput).toHaveValue('celular')

    // Results section (either products or no-results message)
    await expect(page.getByText(/resultado|encontraron/i)).toBeVisible({ timeout: 5000 })

    // If results exist, product grid or cards should be present
    const productLinks = page.locator('a[href^="/productos/"]')
    const count = await productLinks.count()
    if (count > 0) {
      await expect(productLinks.first()).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Search Error Scenarios', () => {
  test('Empty search from homepage lands on buscar with empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    // Submit hero form with empty input (form submits to /buscar)
    const hero = page.getByRole('region', { name: /lo que buscás|telopillo/i })
    await hero.getByRole('button', { name: /buscar/i }).click()

    // With empty q, we get /buscar or /buscar?q=
    await page.waitForURL(/\/buscar/, { timeout: 5000 })

    // Empty state: "¿Qué estás buscando?"
    await expect(page.getByRole('heading', { name: /qué estás buscando/i })).toBeVisible({
      timeout: 3000,
    })
  })

  test('Non-existent product search shows no results message', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=xyznonexistent123`)
    await page.waitForLoadState('networkidle')

    // Status shows no results
    await expect(
      page.getByText(/no se encontraron resultados|no encontramos productos/i)
    ).toBeVisible({ timeout: 5000 })

    // Query retained in URL
    expect(page.url()).toContain('xyznonexistent123')
  })

  test('Special characters and XSS attempt do not break search', async ({ page }) => {
    const xssQuery = '<script>alert(1)</script>'
    const response = await page.goto(`${BASE_URL}/buscar?q=${encodeURIComponent(xssQuery)}`)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    // Page shows search UI
    await expect(page.getByRole('heading', { name: /buscar productos/i })).toBeVisible()

    // No alert dialog should have appeared (would block if it did)
    // Verify no script tags in body content
    const hasInjectedScript = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script')
      return Array.from(scripts).some(
        (s) => s.textContent?.includes('alert(1)') && !s.getAttribute('src')
      )
    })
    expect(hasInjectedScript).toBe(false)
  })
})
