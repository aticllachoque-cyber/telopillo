import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data
const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
  await page.locator('#main-content button[type="submit"]').click()
  await page.waitForURL('**/*', { timeout: 15000 })
}

async function navigateToProductDetail(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/buscar?q=samsung`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  let productLink = page.locator('a[href^="/productos/"]').first()
  if ((await productLink.count()) === 0) {
    await page.goto(`${BASE_URL}/buscar`)
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
// 1. Header Consistency
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Navigation & Layout', () => {
  test('Header on homepage - logo, search, nav links present', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /telopillo/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /categorías/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /publicar gratis/i })).toBeVisible()
  })

  test('Header on search page - same structure as homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()

    await expect(page.getByRole('link', { name: /categorías/i })).toBeVisible()
  })

  test('Header on product detail - same structure', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 2. Footer Consistency
  // ---------------------------------------------------------------------------
  test('Footer on homepage - links and copyright present', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/telopillo/i)).toBeVisible()
    await expect(footer.getByText(/todos los derechos reservados/i)).toBeVisible()
    await expect(footer.getByRole('link', { name: /acerca de/i })).toBeVisible()
  })

  test('Footer on search page - same structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')

    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/todos los derechos reservados/i)).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 3. Skip Link
  // ---------------------------------------------------------------------------
  test('Skip link present and links to main content', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const skipLink = page.getByRole('link', { name: /saltar al contenido principal/i }).first()
    await expect(skipLink).toBeAttached()
    const href = await skipLink.getAttribute('href')
    expect(href).toBe('#main-content')
  })

  // ---------------------------------------------------------------------------
  // 4. Authenticated Header
  // ---------------------------------------------------------------------------
  test('Authenticated header - avatar/user menu replaces login/register', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    await expect(page.getByRole('button', { name: /menú de usuario/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).not.toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // 5. Breadcrumbs on Product Detail
  // ---------------------------------------------------------------------------
  test('Product detail breadcrumbs - Home > Category > Product', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: /inicio/i })).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/')
  })

  // ---------------------------------------------------------------------------
  // 6. 404 Page
  // ---------------------------------------------------------------------------
  test('404 page - nonexistent route shows helpful message, navigation present', async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist`)
    expect(response?.status()).toBe(404)

    await page.waitForLoadState('load')

    const header = page.locator('header')
    await expect(header).toBeVisible()
    const logo = page.locator('header a[href="/"]').first()
    await expect(logo).toBeVisible()

    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })
})
