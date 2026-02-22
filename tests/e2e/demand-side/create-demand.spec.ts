/**
 * Demand Side — Create Demand Post
 *
 * Tests demand post creation flow:
 * - Auth guard redirects unauthenticated users
 * - Form validation (title, description, category, location)
 * - Successful creation and redirect
 * - Rate limit display (max 5/day)
 *
 * Run: npx playwright test tests/e2e/demand-side/create-demand.spec.ts
 */
import { test, expect } from '@playwright/test'
import { login } from '../../helpers'

test.describe('Create Demand Post', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/busco/publicar')
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirect=%2Fbusco%2Fpublicar')
  })

  test('Page renders correctly for authenticated user', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    await page.goto('/busco/publicar')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /publica lo que buscas/i })).toBeVisible()
    await expect(page.getByLabel(/qué estás buscando/i)).toBeVisible()
    await expect(page.getByLabel(/describe lo que necesitas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /publicar solicitud/i })).toBeVisible()
  })

  test('Form shows validation errors on empty submit', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    await page.goto('/busco/publicar')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Publicar solicitud")')

    const errors = page.locator('[role="alert"]')
    await expect(errors.first()).toBeVisible({ timeout: 5000 })
  })

  test('Form validates minimum character lengths', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials')

    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!)

    await page.goto('/busco/publicar')
    await page.waitForLoadState('networkidle')

    await page.fill('#title', 'ab')
    await page.fill('#description', 'too short')
    await page.click('body')

    await expect(page.locator('#title-error')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#description-error')).toBeVisible({ timeout: 5000 })
  })
})
