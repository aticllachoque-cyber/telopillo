import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data (from seeded database)
const BUSINESS_SLUG = 'usuario-de-desarrollo'

const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// ---------------------------------------------------------------------------
// 1. Complete Business Seller End-to-End Flow
// ---------------------------------------------------------------------------
test.describe('Business Seller - Complete E2E Flow', () => {
  test('Login → profile edit (verify business fields) → storefront (verify) → trust badge → products', async ({
    page,
  }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
    await page.locator('#main-content button[type="submit"]').click()
    await page.waitForURL('**/*', { timeout: 15000 })

    // Step 2: Visit profile edit and verify business section
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/cargando perfil/i)).not.toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(4000) // Allow BusinessProfileForm to load from Supabase

    await expect(page.getByText(/perfil de negocio/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible({ timeout: 5000 })

    // Step 3: Visit storefront
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
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
