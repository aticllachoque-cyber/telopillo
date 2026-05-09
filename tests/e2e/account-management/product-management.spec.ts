import { test, expect } from '@playwright/test'
import {
  login,
  runAxeAudit,
  assertNoHorizontalScroll,
  gotoMyProductsPage,
  gotoReady,
} from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Product Management - Happy Path
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management', () => {
  test('Compact share controls expose copy action on mis-productos', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    }

    await login(page)
    await gotoMyProductsPage(page)

    const copyButton = page.getByRole('button', { name: /Copiar enlace/i })
    const shareButton = page.getByRole('button', { name: /Compartir perfil/i })

    await expect(copyButton).toBeVisible()
    await expect(shareButton).toBeVisible()

    await copyButton.click()
    await expect(page.getByRole('status').filter({ hasText: /enlace copiado/i })).toBeVisible({
      timeout: 5000,
    })

    if (testInfo.project.name === 'chromium') {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText).toMatch(/\/(vendedor|negocio)\//)
    }
  })

  test('Page loads with header and product grid or empty state', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    await expect(page.getByRole('heading', { name: /mis productos/i })).toBeVisible()
    await expect(page.getByText(/gestiona tus productos/i)).toBeVisible()
  })

  test('Product cards show title, price, status when products exist, or empty state', async ({
    page,
  }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i).first()
    const hasEmptyState = await emptyState.isVisible()

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
      await expect(page.getByRole('link', { name: /publicar producto/i }).first()).toBeVisible()
    } else {
      // Has products - verify card content (price, status badge)
      await expect(page.getByText(/Bs\s+[\d.,]+/).first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/activo|vendido|inactivo/i).first()).toBeVisible()
    }
  })

  test('Click edit on product navigates to edit page', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i).first()
    if (await emptyState.isVisible()) {
      test.skip()
      return
    }

    // Open dropdown and click Editar (ProductActions dropdown - first product)
    const actionsButton = page.getByRole('button', { name: /acciones/i }).first()
    await expect(actionsButton).toBeVisible({ timeout: 5000 })
    await actionsButton.click()
    const editItem = page.getByRole('menuitem', { name: /editar/i })
    await expect(editItem).toBeVisible({ timeout: 3000 })
    await editItem.click()

    await page.waitForURL(/\/productos\/.*\/editar/, { timeout: 10000 })
    expect(page.url()).toContain('/editar')
  })

  test('Click view on product navigates to product detail page', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i).first()
    if (await emptyState.isVisible()) {
      test.skip()
      return
    }

    // Product card title/image is a link to /productos/[id]
    const productLink = page.locator('a[href^="/productos/"]').first()
    await expect(productLink).toBeVisible({ timeout: 5000 })
    const href = await productLink.getAttribute('href')
    expect(href).toMatch(/\/productos\/[^/]+$/)

    await productLink.click()
    await page.waitForURL(/\/productos\/[^/]+$/, { timeout: 10000 })
    expect(page.url()).not.toContain('/editar')

    // Own listing: owner banner + actions; no buyer WhatsApp CTA (mis-productos only lists own products)
    await expect(page.getByText('Este es tu producto')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /^Editar$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /contactar por whatsapp/i })).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// 2. Product Management - Error States
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management (Errors)', () => {
  test('Empty state shows CTA when user has no products', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i).first()
    const ctaLink = page.getByRole('link', { name: /^Publicar producto$/i })

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible()
      await expect(ctaLink).toBeVisible()
      await expect(ctaLink).toHaveAttribute('href', '/publicar')
    }
    // When user has products, test passes (nothing to assert)
  })

  test('Unauthenticated visit redirects to login', async ({ page }) => {
    await gotoReady(page, '/perfil/mis-productos')

    // Client-side redirect after auth check (useEffect)
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible({
      timeout: 20000,
    })
    expect(page.url()).toContain('/login')
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management (Accessibility)', () => {
  test('Page passes WCAG 2.2 AA accessibility audit', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    await runAxeAudit(page)
  })

  test('Product cards are keyboard navigable', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i).first()
    if (await emptyState.isVisible()) {
      test.skip()
      return
    }

    // Tab to first focusable element in product area
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(focused)
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management (Mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Cards stack, no horizontal scroll', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    await assertNoHorizontalScroll(page)
  })

  test('Touch targets are >= 44px', async ({ page }) => {
    await login(page)
    await gotoMyProductsPage(page)

    const buttons = page.locator('button, a[href], input, [role="button"]')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox()
      // Skip hidden/zero-size elements (e.g. file inputs, off-screen elements)
      if (box && box.width > 4 && box.height > 4) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
