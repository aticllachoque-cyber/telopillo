import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Authentication Pages', () => {
  test('Login page renders correctly with OAuth buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Check page title/heading
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible()

    // Check form fields
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()

    // Check OAuth buttons (Google + Facebook)
    await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continuar con facebook/i })).toBeVisible()

    // Check forgot password link
    await expect(page.getByRole('link', { name: /olvidaste tu contraseña/i })).toBeVisible()

    // Check register link
    await expect(page.getByRole('link', { name: /regístrate/i })).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-page.png', fullPage: true })
  })

  test('Login form validation shows errors for invalid input', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Submit empty form
    await page.getByRole('button', { name: /iniciar sesión/i }).click()

    // Should show validation errors
    await expect(page.getByText(/email inválido|inválido/i)).toBeVisible({ timeout: 3000 })
  })

  test('Register page renders correctly with OAuth buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)

    // Check page heading
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible()

    // Check form fields
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i).first()).toBeVisible()
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible()

    // Check OAuth buttons
    await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continuar con facebook/i })).toBeVisible()

    // Check login link
    await expect(page.getByRole('link', { name: /inicia sesión/i })).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/register-page.png', fullPage: true })
  })

  test('Register form validation shows errors for invalid input', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)

    // Fill invalid data
    await page.getByLabel(/nombre completo/i).fill('A') // Too short
    await page.getByLabel(/email/i).first().fill('invalid-email')
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('weak') // Too weak
    await page.getByLabel(/confirmar contraseña/i).fill('different')

    // Submit form
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Should show validation errors
    await expect(page.getByText(/inválido|caracteres|mayúscula|número|coinciden/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('Forgot password page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`)

    // Check page heading
    await expect(page.getByRole('heading', { name: /olvidaste tu contraseña/i })).toBeVisible()

    // Check form
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /enviar link/i })).toBeVisible()

    // Check back to login link
    await expect(page.getByRole('link', { name: /volver a iniciar sesión/i })).toBeVisible()

    // Note: Forgot password page does NOT have OAuth buttons (by design)

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/forgot-password-page.png', fullPage: true })
  })

  test('Forgot password form validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`)

    // Submit with invalid email - "a@b" passes HTML5 but fails Zod email format
    await page.getByLabel(/email/i).fill('a@b')
    await page.getByRole('button', { name: /enviar link/i }).click()

    // Should show Zod validation error
    await expect(page.getByText(/inválido/i)).toBeVisible({ timeout: 3000 })
  })
})
