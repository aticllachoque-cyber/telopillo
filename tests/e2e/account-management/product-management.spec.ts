import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// ---------------------------------------------------------------------------
// Helper: Login
// ---------------------------------------------------------------------------
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
  await page.locator('#main-content button[type="submit"]').click()
  await page.waitForURL('**/*', { timeout: 15000 })
}

// ---------------------------------------------------------------------------
// 1. Product Management - Happy Path
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management', () => {
  test('Page loads with header and product grid or empty state', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /mis productos/i })).toBeVisible()
    await expect(page.getByText(/gestiona tus publicaciones/i)).toBeVisible()
  })

  test('Product cards show title, price, status when products exist, or empty state', async ({
    page,
  }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i)
    const hasEmptyState = await emptyState.isVisible()

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
      await expect(page.getByRole('link', { name: /publicar producto/i })).toBeVisible()
    } else {
      // Has products - verify card content (price, status badge)
      await expect(page.getByText(/Bs\s+[\d.,]+/)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/activo|vendido|inactivo/i).first()).toBeVisible()
    }
  })

  test('Click edit on product navigates to edit page', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i)
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
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i)
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
  })
})

// ---------------------------------------------------------------------------
// 2. Product Management - Error States
// ---------------------------------------------------------------------------
test.describe('Account Management - Product Management (Errors)', () => {
  test('Empty state shows CTA when user has no products', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i)
    const ctaLink = page.getByRole('link', { name: /publicar producto/i })

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible()
      await expect(ctaLink).toBeVisible()
      await expect(ctaLink).toHaveAttribute('href', '/publicar')
    }
    // When user has products, test passes (nothing to assert)
  })

  test('Unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

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
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
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

  test('Product cards are keyboard navigable', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/no tienes productos|aún no has publicado/i)
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
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Touch targets are >= 44px', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
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
