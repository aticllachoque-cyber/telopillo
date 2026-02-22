import { test } from '@playwright/test'
import { login, runAxeAudit, TEST_DATA } from '../../helpers'

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

// ---------------------------------------------------------------------------
// 1. Public Pages - Accessibility Audit
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Accessibility Audit (Public Pages)', () => {
  test('Homepage - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Login page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Register page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Register page with business expanded - no critical/serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    const toggle = page.getByRole('button', { name: /negocio.*opcional|tienes un negocio/i })
    await toggle.click()
    await page.waitForTimeout(500)

    await runAxeAudit(page, { exclude: ['[data-slot="select-value"]'] })
  })

  test('Forgot password page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Search results (samsung) - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/buscar?q=samsung')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await runAxeAudit(page)
  })

  test('Search empty state (nonexistent) - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/buscar?q=nonexistent')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await runAxeAudit(page)
  })

  test('Categories page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto('/categorias')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Product detail page - no critical/serious a11y issues', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    await runAxeAudit(page)
  })

  test('Seller profile page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`/vendedor/${TEST_DATA.businessSellerId}`)
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Business storefront page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })
})

// ---------------------------------------------------------------------------
// 2. Auth Pages - Accessibility Audit
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Accessibility Audit (Auth Pages)', () => {
  test('Profile page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await runAxeAudit(page, { exclude: ['[data-slot="avatar-fallback"]'] })
  })

  test('Profile edit page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    await runAxeAudit(page, {
      exclude: ['[data-slot="avatar-fallback"]', '[data-slot="select-value"]'],
    })
  })

  test('My products page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await runAxeAudit(page)
  })

  test('Publish page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await runAxeAudit(page, { exclude: ['[data-slot="select-value"]'] })
  })
})
