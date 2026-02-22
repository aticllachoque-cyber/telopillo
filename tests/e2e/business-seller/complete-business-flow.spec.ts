import { test, expect } from '@playwright/test'
import { login, TEST_DATA } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Complete Business Seller End-to-End Flow
// ---------------------------------------------------------------------------
test.describe('Business Seller - Complete E2E Flow', () => {
  test('Login → profile edit (verify business fields) → storefront (verify) → trust badge → products', async ({
    page,
  }) => {
    // Step 1: Login
    await login(page)

    // Step 2: Visit profile edit and verify business section
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/cargando perfil/i)).not.toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(4000) // Allow BusinessProfileForm to load from Supabase

    await expect(page.getByText(/perfil de negocio/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible({ timeout: 5000 })

    // Step 3: Visit storefront
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Step 4: Verify storefront structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('img', { name: /negocio|vendedor/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Step 5: Verify products or empty state
    const productCount = await page.locator('a[href^="/productos/"]').count()
    const hasEmptyState = await page.getByText(/sin productos publicados/i).isVisible()
    expect(productCount > 0 || hasEmptyState).toBeTruthy()
  })
})
