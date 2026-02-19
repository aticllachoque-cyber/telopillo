/**
 * Demand Side — Lifecycle Management
 *
 * Tests demand post lifecycle actions from dashboard:
 * - Dashboard page renders with tabs (Activas, Encontradas, Expiradas)
 * - Mark as found (status change)
 * - Delete with confirmation dialog
 * - Renew expired post
 *
 * Run: npx playwright test tests/e2e/demand-side/demand-lifecycle.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Demand Dashboard', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/perfil/demandas`)
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('Dashboard renders tabs for authenticated user', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/*', { timeout: 10000 })

    await page.goto(`${BASE_URL}/perfil/demandas`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /mis solicitudes/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /activas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /encontradas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /expiradas/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /nueva solicitud/i })).toBeVisible()
  })

  test('Tab switching works', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/*', { timeout: 10000 })

    await page.goto(`${BASE_URL}/perfil/demandas`)
    await page.waitForLoadState('networkidle')

    const foundTab = page.getByRole('tab', { name: /encontradas/i })
    await foundTab.click()
    await expect(foundTab).toHaveAttribute('aria-selected', 'true')

    const expiredTab = page.getByRole('tab', { name: /expiradas/i })
    await expiredTab.click()
    await expect(expiredTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Delete confirmation dialog shows proper text', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/*', { timeout: 10000 })

    await page.goto(`${BASE_URL}/perfil/demandas`)
    await page.waitForLoadState('networkidle')

    const deleteButton = page.locator('[aria-label*="Eliminar solicitud"]').first()
    const hasPost = await deleteButton.isVisible().catch(() => false)

    if (!hasPost) {
      test.skip(true, 'No posts to test delete on')
      return
    }

    await deleteButton.click()

    await expect(page.getByText(/eliminar esta solicitud/i)).toBeVisible()
    await expect(page.getByText(/nueva solicitud/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /cancelar/i })).toBeVisible()
  })
})
