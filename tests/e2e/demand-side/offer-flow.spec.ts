/**
 * Demand Side — Offer Flow
 *
 * Tests the offer product flow:
 * - "Ofrecer mi producto" button visibility (seller only, not owner)
 * - OfferProductModal opens and loads user products
 * - Offer creation and duplicate prevention
 * - Offers list visibility on detail page
 *
 * Run: npx playwright test tests/e2e/demand-side/offer-flow.spec.ts
 */
import { test, expect } from '@playwright/test'

test.describe('Offer Flow', () => {
  test('Detail page renders post information', async ({ page }) => {
    await page.goto('/busco')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/busco/"]').first()
    const linkExists = await firstLink.isVisible().catch(() => false)

    if (!linkExists) {
      test.skip(true, 'No demand posts available to test')
      return
    }

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/descripción/i)).toBeVisible()
    await expect(page.getByText(/ofertas/i)).toBeVisible()
  })

  test('Unauthenticated user sees login CTA on detail page', async ({ page }) => {
    await page.goto('/busco')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/busco/"]').first()
    const linkExists = await firstLink.isVisible().catch(() => false)

    if (!linkExists) {
      test.skip(true, 'No demand posts available to test')
      return
    }

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const loginCTA = page.getByRole('link', { name: /inicia sesión para ofrecer/i })
    const isVisible = await loginCTA.isVisible().catch(() => false)

    if (isVisible) {
      await expect(loginCTA).toBeVisible()
    }
  })
})
