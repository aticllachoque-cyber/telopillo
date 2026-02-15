import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Product Detail - Navigation and Content
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Product Detail', () => {
  test('Navigate from search to product detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    // Click first product link
    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    await expect(firstProductLink).toBeVisible({ timeout: 5000 })

    const href = await firstProductLink.getAttribute('href')
    expect(href).toMatch(/\/productos\/[a-f0-9-]+/)

    await firstProductLink.click()
    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Verify we are on product page
    expect(page.url()).toContain('/productos/')
  })

  test('Product detail page shows title, price, description, images, seller card, breadcrumbs', async ({
    page,
  }) => {
    // Go to search first to get a real product ID
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    const count = await firstProductLink.count()
    if (count === 0) {
      await page.goto(`${BASE_URL}/buscar`)
      await page.waitForLoadState('networkidle')
      const anyProduct = page.locator('a[href^="/productos/"]').first()
      const anyCount = await anyProduct.count()
      if (anyCount === 0) {
        test.skip()
        return
      }
      await anyProduct.click()
    } else {
      await firstProductLink.click()
    }

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Title (h1)
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Price in BOB (use first - route announcer also contains price)
    await expect(page.getByText(/Bs \d/).first()).toBeVisible()

    // Description section
    await expect(page.getByRole('heading', { name: /descripción/i })).toBeVisible()

    // Images (gallery or placeholder)
    const images = page.locator('img')
    expect(await images.count()).toBeGreaterThanOrEqual(1)

    // Seller card
    await expect(page.getByRole('heading', { name: /vendedor/i })).toBeVisible()

    // Breadcrumbs
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: /inicio/i })).toBeVisible()
  })

  test('Click seller profile link from seller card navigates to seller page', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    const count = await firstProductLink.count()
    if (count === 0) {
      test.skip()
      return
    }
    await firstProductLink.click()
    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Click "Ver perfil del vendedor" or "Visitar tienda" in seller card
    const sellerProfileLink = page.getByRole('link', {
      name: /ver perfil del vendedor|visitar tienda/i,
    })
    await expect(sellerProfileLink).toBeVisible({ timeout: 3000 })
    await sellerProfileLink.click()

    await page.waitForURL(/\/vendedor\/[a-f0-9-]+|\/negocio\/[\w-]+/, { timeout: 10000 })
    expect(page.url()).toMatch(/\/vendedor\/|\/negocio\//)
  })
})

// ---------------------------------------------------------------------------
// 2. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Product Detail Errors', () => {
  test('Returns 404 for non-existent product ID', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/productos/00000000-0000-0000-0000-000000000000`)
    expect(response?.status()).toBe(404)
  })

  test('Returns 404 for malformed product ID', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/productos/not-a-valid-uuid-xyz`)
    expect(response?.status()).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Product Detail Accessibility', () => {
  test('Product detail page passes WCAG 2.2 AA accessibility audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    const count = await firstProductLink.count()
    if (count === 0) {
      await page.goto(`${BASE_URL}/buscar`)
      await page.waitForLoadState('networkidle')
      const anyProduct = page.locator('a[href^="/productos/"]').first()
      if ((await anyProduct.count()) === 0) {
        test.skip()
        return
      }
      await anyProduct.click()
    } else {
      await firstProductLink.click()
    }

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
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

  test('Product images have alt text', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    if ((await firstProductLink.count()) === 0) {
      test.skip()
      return
    }
    await firstProductLink.click()
    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
      expect(alt?.trim().length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Product Detail Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('No horizontal scroll on product detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    if ((await firstProductLink.count()) === 0) {
      await page.goto(`${BASE_URL}/buscar`)
      await page.waitForLoadState('networkidle')
      const anyProduct = page.locator('a[href^="/productos/"]').first()
      if ((await anyProduct.count()) === 0) {
        test.skip()
        return
      }
      await anyProduct.click()
    } else {
      await firstProductLink.click()
    }

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Touch targets are >= 44px on product detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=celular`)
    await page.waitForLoadState('networkidle')

    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    if ((await firstProductLink.count()) === 0) {
      test.skip()
      return
    }
    await firstProductLink.click()
    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const buttons = page.locator('button, a[href], input, [role="button"]')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
