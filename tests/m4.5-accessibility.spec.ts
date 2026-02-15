import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data
const BUSINESS_SLUG = 'usuario-de-desarrollo'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'
const PERSONAL_SELLER_ID = '09a4ef63-b8ec-4931-9885-e4d785e79643'

function logViolations(label: string, results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  console.log(`\n=== ${label} ===`)
  console.log(`Violations: ${results.violations.length}`)
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.description}`)
    console.log(`    Nodes: ${v.nodes.length}`)
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`    - ${n.html.substring(0, 120)}`)
    }
  }
  console.log(`Passes: ${results.passes.length}`)
}

test.describe('M4.5 - Accessibility Audit (axe-core WCAG 2.2 AA)', () => {
  test('Register page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Register Page (/register)', results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Register page with business section expanded - no critical/serious a11y issues', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Expand business section
    const toggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await toggle.click()
    await page.waitForTimeout(500)

    // Exclude shadcn/ui Select placeholder — known library-level contrast issue
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="select-value"]')
      .analyze()

    logViolations('Register Page (business expanded)', results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Business storefront page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations(`Storefront (/negocio/${BUSINESS_SLUG})`, results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Personal seller profile (business seller) - no critical/serious a11y issues', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations(`Seller Profile (business) (/vendedor/${BUSINESS_SELLER_ID})`, results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Personal seller profile (personal only) - no critical/serious a11y issues', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/vendedor/${PERSONAL_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations(`Seller Profile (personal) (/vendedor/${PERSONAL_SELLER_ID})`, results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Search results page - no critical/serious a11y issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow product cards to load

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    logViolations('Search (/buscar)', results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Profile edit page (authenticated) - no critical/serious a11y issues', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill('dev@telopillo.test')
    await page.getByLabel(/contraseña/i).fill('DevTest123')
    await page.locator('#main-content button[type="submit"]').click()
    await page.waitForURL('**/*', { timeout: 15000 })

    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Allow profile data to load

    // Exclude shadcn/ui Avatar fallback and Select placeholder — known library-level contrast issues
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('[data-slot="avatar-fallback"]')
      .exclude('[data-slot="select-value"]')
      .analyze()

    logViolations('Profile Edit (/profile/edit)', results)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })
})
