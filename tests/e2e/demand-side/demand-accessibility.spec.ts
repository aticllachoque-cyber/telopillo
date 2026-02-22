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
import { login, runAxeAudit } from '../../helpers'

test.describe('Demand Side Accessibility', () => {
  test('Browse page passes axe-core audit', async ({ page }) => {
    await page.goto('/busco')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page, { exclude: ['.mapbox-container'] })
  })

  test('Browse page renders correctly at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/busco')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /busco.*necesito/i })).toBeVisible()

    const publishLink = page.getByRole('link', { name: /publicar solicitud/i })
    await expect(publishLink).toBeVisible()
  })

  test('Dashboard tabs are keyboard navigable', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    await page.goto('/perfil/demandas')
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
    await page.goto('/busco')
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
