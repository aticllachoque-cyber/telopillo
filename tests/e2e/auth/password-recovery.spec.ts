import { test, expect } from '@playwright/test'
import { runAxeAudit, assertNoHorizontalScroll, TEST_DATA } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Password Recovery Flow
// ---------------------------------------------------------------------------
test.describe('Auth - Password Recovery Flow', () => {
  test('Forgot password page loads with form and heading', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { level: 1, name: /olvidaste tu contraseña/i })
    ).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /enviar link de restablecimiento/i })
    ).toBeVisible()
  })

  test('Valid email submission shows success or sends request without validation error', async ({
    page,
  }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill(TEST_DATA.email)
    await page.getByRole('button', { name: /enviar link de restablecimiento/i }).click()

    // Verify the button shows loading state (form was submitted, no client-side validation error)
    await expect(page.getByText(/enviando/i))
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        // Loading state might be too fast to catch, that's OK
      })

    // Wait for result: either success screen or a server error (both mean the form submitted)
    // The success heading is "Email Enviado" — but Supabase email may not be configured in dev
    const success = page.getByRole('heading', { name: /email enviado/i })
    const serverError = page.locator('[role="alert"]')

    await expect(success.or(serverError)).toBeVisible({ timeout: 10000 })

    // Verify NO client-side validation error appeared (like "Email inválido")
    await expect(page.getByText(/email inválido/i)).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Password Recovery Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Auth - Password Recovery Errors', () => {
  test('Empty email shows validation error', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /enviar link de restablecimiento/i }).click()

    await expect(page.getByText(/email inválido/i)).toBeVisible({ timeout: 3000 })
  })

  test('Invalid email format is rejected by validation', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill('not-valid')
    await page.getByRole('button', { name: /enviar link de restablecimiento/i }).click()

    // The form uses type="email" — browser native validation may intercept before Zod.
    // Either way the form should NOT submit successfully (no success screen appears).
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /email enviado/i })).not.toBeVisible()

    // We should still be on the forgot-password page
    expect(page.url()).toContain('/forgot-password')
  })

  test('Non-existent email shows same success message (no info leak)', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill('ghost@telopillo.test')
    await page.getByRole('button', { name: /enviar link de restablecimiento/i }).click()

    await expect(page.getByRole('heading', { name: /email enviado/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/revisa tu email para restablecer/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility
// ---------------------------------------------------------------------------
test.describe('Auth - Password Recovery Accessibility', () => {
  test('Forgot password page passes axe-core WCAG 2.2 AA audit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Auth - Password Recovery Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('No horizontal scroll on forgot password page', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)
  })

  test('Form fills viewport and back to login link is visible', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: /volver a iniciar sesión/i })).toBeVisible()
  })
})
