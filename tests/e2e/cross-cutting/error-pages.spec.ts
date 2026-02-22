import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// 1. Generic 404 Page
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Error Pages', () => {
  test('Non-existent page returns 404 with helpful message and navigation', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)

    await page.waitForLoadState('load')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute('href', '/')

    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 2. Product Not Found
  // ---------------------------------------------------------------------------
  test('Non-existent product returns 404 with navigation', async ({ page }) => {
    const response = await page.goto('/productos/00000000-0000-0000-0000-000000000000')
    expect(response?.status()).toBe(404)

    await page.waitForLoadState('load')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 3. Seller Not Found
  // ---------------------------------------------------------------------------
  test('Non-existent seller returns 404 with navigation', async ({ page }) => {
    const response = await page.goto('/vendedor/00000000-0000-0000-0000-000000000000')
    expect(response?.status()).toBe(404)

    await page.waitForLoadState('load')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 4. Business Not Found
  // ---------------------------------------------------------------------------
  test('Non-existent business slug returns 404 with navigation', async ({ page }) => {
    const response = await page.goto('/negocio/this-slug-does-not-exist')
    expect(response?.status()).toBe(404)

    await page.waitForLoadState('load')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
  })
})
