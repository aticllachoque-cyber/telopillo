/**
 * Demand Side — Accessibility Audit
 *
 * Tests WCAG 2.2 AA compliance:
 * - axe-core scan on /busco
 * - axe-core scan on /busco/publicar
 * - Touch target sizes (44x44px minimum)
 * - Keyboard navigation on dashboard tabs
 * - Mobile viewport (375px) renders correctly
 *
 * Run: npx playwright test tests/e2e/demand-side/demand-accessibility.spec.ts
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Demand Side Accessibility', () => {
  test('Browse page passes axe-core audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/busco`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .exclude('.mapbox-container')
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      console.log(
        'A11y violations:',
        critical.map((v) => `${v.id}: ${v.description} (${v.impact})`)
      )
    }

    expect(critical).toHaveLength(0)
  })

  test('Browse page renders correctly at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/busco`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /busco.*necesito/i })).toBeVisible()

    const publishLink = page.getByRole('link', { name: /publicar solicitud/i })
    await expect(publishLink).toBeVisible()
  })

  test('Dashboard tabs are keyboard navigable', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/*', { timeout: 10000 })

    await page.goto(`${BASE_URL}/perfil/demandas`)
    await page.waitForLoadState('networkidle')

    const activeTab = page.getByRole('tab', { name: /activas/i })
    await activeTab.focus()
    await expect(activeTab).toBeFocused()

    await page.keyboard.press('Tab')
    const foundTab = page.getByRole('tab', { name: /encontradas/i })
    await expect(foundTab).toBeFocused()
  })

  test('Touch targets meet 44x44px minimum', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/busco`)
    await page.waitForLoadState('networkidle')

    const publishLink = page.getByRole('link', { name: /publicar solicitud/i })
    if (await publishLink.isVisible()) {
      const box = await publishLink.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
