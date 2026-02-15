import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data
const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'
const BUSINESS_SLUG = 'usuario-de-desarrollo'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'

function logViolations(label: string, results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  const critical = results.violations.filter((v) => v.impact === 'critical')
  const serious = results.violations.filter((v) => v.impact === 'serious')
  if (critical.length > 0 || serious.length > 0) {
    console.log(`\n=== ${label} ===`)
    console.log(`Violations: ${results.violations.length}`)
    ;[...critical, ...serious].forEach((v) => {
      console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`)
      v.nodes.slice(0, 3).forEach((n) => console.log(`    → ${n.html.substring(0, 80)}`))
    })
  }
}

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
// 1. Public Pages - Accessibility Audit
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Accessibility Audit (Public Pages)', () => {
  test('Homepage - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Homepage (/)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Login page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Login (/login)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Register page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Register (/register)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Register page with business expanded - no critical/serious a11y issues', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const toggle = page.getByRole('button', { name: /negocio.*opcional|tienes un negocio/i })
    await toggle.click()
    await page.waitForTimeout(500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="select-value"]')
      .analyze()

    logViolations('Register (business expanded)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Forgot password page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Forgot Password (/forgot-password)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Search results (samsung) - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Search (/buscar?q=samsung)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Search empty state (nonexistent) - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=nonexistent`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Search empty state (/buscar?q=nonexistent)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Categories page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/categorias`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Categories (/categorias)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Product detail page - no critical/serious a11y issues', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Product Detail (/productos/[id])', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Seller profile page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations(`Seller Profile (/vendedor/${BUSINESS_SELLER_ID})`, results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Business storefront page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations(`Business Storefront (/negocio/${BUSINESS_SLUG})`, results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 2. Auth Pages - Accessibility Audit
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - Accessibility Audit (Auth Pages)', () => {
  test('Profile page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="avatar-fallback"]')
      .analyze()

    logViolations('Profile (/profile)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Profile edit page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="avatar-fallback"]')
      .exclude('[data-slot="select-value"]')
      .analyze()

    logViolations('Profile Edit (/profile/edit)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('My products page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('My Products (/perfil/mis-productos)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Publish page - no critical/serious a11y issues', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="select-value"]')
      .analyze()

    logViolations('Publish (/publicar)', results)
    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })
})
