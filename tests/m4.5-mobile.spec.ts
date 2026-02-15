import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data
const BUSINESS_SLUG = 'usuario-de-desarrollo'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'
const PERSONAL_SELLER_ID = '09a4ef63-b8ec-4931-9885-e4d785e79643'

// Use mobile viewport for all tests in this file
test.use({
  viewport: { width: 375, height: 812 }, // iPhone SE / small mobile
})

test.describe('M4.5 - Mobile Responsive (375px)', () => {
  test('Register page is usable at mobile width', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Form fields should be visible and not overflow
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()

    // Business toggle should be visible
    const toggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await expect(toggle).toBeVisible()

    // Expand business section
    await toggle.click()
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px tolerance

    await page.screenshot({ path: 'tests/screenshots/m4.5-mobile-register.png', fullPage: true })
  })

  test('Business storefront is responsive at mobile width', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Business name and badge should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Products section heading
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Sidebar should stack below content on mobile (not side by side)
    // This means the sidebar content should be below the products section in DOM flow
    // We verify by checking that both sections are visible (not hidden)
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

    await page.screenshot({ path: 'tests/screenshots/m4.5-mobile-storefront.png', fullPage: true })
  })

  test('Seller profile is responsive at mobile width', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Name and badge should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('img', { name: /negocio|vendedor/i }).first()).toBeVisible()

    // Action buttons should be visible
    await expect(page.getByText(/miembro desde/i)).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

    await page.screenshot({ path: 'tests/screenshots/m4.5-mobile-seller-biz.png', fullPage: true })
  })

  test('Personal seller profile (no business) at mobile width', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${PERSONAL_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // No-phone message should be visible and readable
    await expect(page.getByText(/no ha agregado un número de contacto/i)).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

    await page.screenshot({
      path: 'tests/screenshots/m4.5-mobile-seller-personal.png',
      fullPage: true,
    })
  })

  test('Search results with product cards at mobile width', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Product cards should be visible
    const cards = page.locator('a[href^="/productos/"]')
    const count = await cards.count()

    if (count > 0) {
      // First card should be visible and not overflow
      await expect(cards.first()).toBeVisible()
    }

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

    await page.screenshot({ path: 'tests/screenshots/m4.5-mobile-search.png', fullPage: true })
  })

  test('Verification badge is readable on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    const badge = page.getByRole('img', { name: /negocio|vendedor/i }).first()
    await expect(badge).toBeVisible()

    // Badge should fit within viewport
    const box = await badge.boundingBox()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 5) // Within viewport
      expect(box.height).toBeGreaterThanOrEqual(20) // Readable size
    }
  })

  test('Touch targets are at least 44px on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Check submit button
    const submitBtn = page.getByRole('button', { name: /crear cuenta/i })
    const btnBox = await submitBtn.boundingBox()
    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(44)
    }

    // Check business toggle button
    const toggle = page.getByRole('button', { name: /negocio.*opcional/i })
    const toggleBox = await toggle.boundingBox()
    if (toggleBox) {
      expect(toggleBox.height).toBeGreaterThanOrEqual(44)
    }
  })
})
