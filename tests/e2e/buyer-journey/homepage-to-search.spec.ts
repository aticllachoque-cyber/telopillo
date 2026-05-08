import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// 1. Homepage Hero and Search
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Homepage to Search', () => {
  test('Homepage loads with hero section and search bar', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    // Hero heading
    await expect(
      page.getByRole('heading', { level: 1, name: /lo buscás|te lo pillo/i })
    ).toBeVisible()

    // Search form in hero (scope to hero - header also has a search bar)
    const hero = page.getByRole('region', { name: /lo buscás|te lo pillo/i })
    const searchForm = hero.getByRole('search', { name: /buscar productos/i })
    await expect(searchForm).toBeVisible()

    // Search input in hero
    await expect(hero.getByLabel(/qué estás buscando/i)).toBeVisible()

    // Search button in hero
    await expect(hero.getByRole('button', { name: /buscar/i })).toBeVisible()
  })

  test('Search from hero redirects to /buscar with query', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const hero = page.getByRole('region', { name: /lo buscás|te lo pillo/i })
    const searchInput = hero.getByLabel(/qué estás buscando/i)
    await searchInput.fill('celular')
    await hero.getByRole('button', { name: /buscar/i }).click()

    await page.waitForURL(/\/buscar\?q=celular/, { timeout: 10000 })
    expect(page.url()).toContain('/buscar')
    expect(page.url()).toContain('q=celular')
  })

  test('Search results page shows product cards and retains query', async ({ page }) => {
    await page.goto('/buscar?q=celular')
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
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Submit hero form with empty input; form stays put and shows inline validation
    const hero = page.getByRole('region', { name: /lo buscás|te lo pillo/i })
    await hero.getByRole('button', { name: /buscar/i }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(hero.getByText(/escribí el nombre de un producto para buscar/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('Non-existent product search shows no results message', async ({ page }) => {
    await page.goto('/buscar?q=xyznonexistent123')
    await page.waitForLoadState('networkidle')

    // Empty state: status line and heading both mention no results; assert heading (unique)
    await expect(page.getByRole('heading', { name: /no encontramos productos/i })).toBeVisible({
      timeout: 5000,
    })

    // Query retained in URL
    expect(page.url()).toContain('xyznonexistent123')
  })

  test('Special characters and XSS attempt do not break search', async ({ page }) => {
    const xssQuery = '<script>alert(1)</script>'
    let dialogSeen = false
    page.on('dialog', async (dialog) => {
      dialogSeen = true
      await dialog.dismiss()
    })

    const response = await page.goto(`/buscar?q=${encodeURIComponent(xssQuery)}`)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    // Page shows search UI
    await expect(page.getByRole('heading', { name: /buscar productos/i })).toBeVisible()

    // Query must render as plain text/value, not execute.
    const searchInput = page.locator('input[type="search"]').first()
    await expect(searchInput).toHaveValue(xssQuery)
    expect(dialogSeen).toBe(false)
  })
})
