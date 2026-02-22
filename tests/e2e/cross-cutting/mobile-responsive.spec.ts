import { test, expect } from '@playwright/test'
import { login, assertNoHorizontalScroll, TEST_DATA } from '../../helpers'

async function navigateToProductDetail(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/buscar?q=samsung')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  let productLink = page.locator('a[href^="/productos/"]').first()
  if ((await productLink.count()) === 0) {
    await page.goto('/buscar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    productLink = page.locator('a[href^="/productos/"]').first()
  }
  if ((await productLink.count()) === 0) return false

  await productLink.click()
  await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  return true
}

// Use mobile viewport for all tests in this file
test.use({
  viewport: { width: 375, height: 812 },
})

// ---------------------------------------------------------------------------
// 1. Public Pages - Mobile Responsive
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Mobile Responsive (375x812)', () => {
  test('Homepage - no horizontal scroll, key elements visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('search', { name: /buscar productos/i })).toBeVisible()
  })

  test('Login page - no horizontal scroll, form visible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('Register page - no horizontal scroll, form visible', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible()
  })

  test('Search results (samsung) - no horizontal scroll, key elements visible', async ({
    page,
  }) => {
    await page.goto('/buscar?q=samsung')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { name: /buscar productos/i })).toBeVisible()
  })

  test('Categories page - no horizontal scroll, category grid visible', async ({ page }) => {
    await page.goto('/categorias')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { name: /categorías/i })).toBeVisible()
  })

  test('Product detail page - no horizontal scroll, key elements visible', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Bs \d/)).toBeVisible()
  })

  test('Seller profile page - no horizontal scroll, key elements visible', async ({ page }) => {
    await page.goto(`/vendedor/${TEST_DATA.businessSellerId}`)
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('Business storefront page - no horizontal scroll, key elements visible', async ({
    page,
  }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Auth Pages - Mobile Responsive
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Mobile Responsive (Auth Pages)', () => {
  test('Profile edit page - no horizontal scroll, form visible', async ({ page }) => {
    await login(page)
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await assertNoHorizontalScroll(page)

    await expect(page.getByLabel(/nombre completo|nombre/i)).toBeVisible()
  })

  test('My products page - no horizontal scroll, key elements visible', async ({ page }) => {
    await login(page)
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { name: /mis productos|productos/i })).toBeVisible()
  })

  test('Publish page - no horizontal scroll, wizard visible', async ({ page }) => {
    await login(page)
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await assertNoHorizontalScroll(page)

    await expect(page.getByRole('heading', { name: /publicar producto/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Touch Targets
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Touch Targets (>= 44px)', () => {
  test('Touch targets on homepage - buttons and links >= 44px', async ({ page }) => {
    await page.goto('/')
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

  test('Touch targets on login page - submit button >= 44px', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const submitBtn = page.locator('#main-content button[type="submit"]')
    const box = await submitBtn.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('Touch targets on register page - business toggle and submit >= 44px', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    const toggle = page.getByRole('button', { name: /negocio.*opcional|tienes un negocio/i })
    const toggleBox = await toggle.boundingBox()
    if (toggleBox) {
      expect(toggleBox.height).toBeGreaterThanOrEqual(44)
    }

    const submitBtn = page.getByRole('button', { name: /crear cuenta/i })
    const btnBox = await submitBtn.boundingBox()
    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(44)
    }
  })
})
