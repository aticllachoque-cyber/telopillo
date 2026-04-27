import { test, expect } from '@playwright/test'
import { login, runAxeAudit } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. My Products Page
// ---------------------------------------------------------------------------
test.describe('Manage Products - My Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('My products page loads with header and filters', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /mis productos/i })).toBeVisible()
    await expect(page.getByText(/gestiona tus publicaciones/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /publicar nuevo/i })).toBeVisible()
    await expect(page.getByLabel(/estado/i)).toBeVisible()
    await expect(page.getByLabel(/ordenar por/i)).toBeVisible()
  })

  test('Shows product cards with title, price, and status when user has products', async ({
    page,
  }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productCards = page.locator('a[href^="/productos/"]')
    const count = await productCards.count()

    if (count > 0) {
      await expect(productCards.first()).toBeVisible()
      await expect(page.getByText(/Bs\s+\d/).first()).toBeVisible()
      await expect(
        page
          .getByRole('heading', { name: /activo|vendido|inactivo/i })
          .or(page.getByText(/activo|vendido|inactivo/i))
          .first()
      ).toBeVisible()
      const productCountText = page.getByText(/\d+ producto(s)?/)
      await expect(productCountText).toBeVisible()
    }
  })

  test('Empty state shown when filtering by status with no matching products', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    // Try each status filter until we find one with no products (test data can vary)
    const statusFilters = [/inactivos/i, /vendidos/i, /activos/i]
    let foundEmpty = false

    for (const filter of statusFilters) {
      await page.getByRole('button', { name: filter }).click()
      await page.waitForLoadState('networkidle')

      const productLinks = page.locator('a[href^="/productos/"]')
      const count = await productLinks.count()
      if (count === 0) {
        foundEmpty = true
        break
      }
    }

    if (!foundEmpty) {
      test.skip()
      return
    }

    const emptyParagraph = page
      .locator('p')
      .filter({ hasText: /no tienes productos|aún no has publicado/i })
      .first()
    await expect(emptyParagraph).toBeVisible({ timeout: 5000 })
  })

  test('Publicar Nuevo button navigates to /publicar', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /publicar nuevo/i }).click()
    await page.waitForURL('**/publicar**', { timeout: 10000 })
    expect(page.url()).toContain('/publicar')
    await expect(page.getByRole('heading', { name: /publicar producto/i })).toBeVisible()
  })

  test('Product count displays correctly', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const countSection = page.locator('text=/\\d+ producto(s)?/').first()
    const emptyHeading = page.getByRole('heading', { name: /no tienes productos/i })
    const isCount = await countSection.isVisible().catch(() => false)
    const isEmpty = await emptyHeading.isVisible().catch(() => false)
    expect(isCount || isEmpty).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 2. Accessibility
// ---------------------------------------------------------------------------
test.describe('Manage Products - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('My products page passes axe-core audit', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })
})

// ---------------------------------------------------------------------------
// 3. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Manage Products - Mobile Responsive (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('No horizontal scroll on my products page', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Product cards stack vertically on mobile', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const grid = page.locator('.grid')
    const count = await grid.count()
    if (count > 0) {
      const firstGrid = grid.first()
      const classes = await firstGrid.getAttribute('class')
      expect(classes).toContain('grid-cols-1')
    }
  })
})
