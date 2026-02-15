import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test account for login (not used in registration)
const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// Unique email for registration tests (avoids conflicts)
// Note: Registration signup tests require Supabase to allow signups for the test domain.
// If signups are restricted, the full-registration tests will fail at the success assertion.
const uniqueEmail = () => `e2e-register-${Date.now()}@telopillo.test`

// ---------------------------------------------------------------------------
// 1. Register with Business Profile - Happy Path
// ---------------------------------------------------------------------------
test.describe('Business Seller - Register with Business Profile', () => {
  test('Navigate to register, fill personal fields, expand business section, fill business data, submit', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Fill personal fields
    await page.getByLabel(/nombre completo/i).fill('Test Business User')
    await page.getByLabel(/email/i).first().fill(uniqueEmail())
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('DevTest123')
    await page.getByLabel(/confirmar contraseña/i).fill('DevTest123')

    // Expand business section
    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'true')

    // Fill business fields
    await page.getByLabel(/nombre del negocio/i).fill('Mi Tienda Bolivia')
    await page.getByLabel(/categoría del negocio/i).click()
    await page.getByRole('option', { name: 'Tecnologia' }).click()

    // Submit
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Success state
    await expect(page.getByText(/registro exitoso/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /ir a iniciar sesión/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Business Section Toggle
// ---------------------------------------------------------------------------
test.describe('Business Seller - Business Section Toggle', () => {
  test('Business section toggle has correct aria-expanded state', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await expect(businessToggle).toBeVisible()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'false')

    // Expand
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible()

    // Collapse
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'false')
  })
})

// ---------------------------------------------------------------------------
// 3. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Business Seller - Registration Errors', () => {
  test('Expand business but leave name empty shows validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Fill personal fields
    await page.getByLabel(/nombre completo/i).fill('Test User')
    await page.getByLabel(/email/i).first().fill(uniqueEmail())
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('DevTest123')
    await page.getByLabel(/confirmar contraseña/i).fill('DevTest123')

    // Expand business section but leave name empty
    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await businessToggle.click()

    // Submit without business name
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Validation error in Spanish
    await expect(
      page.getByText(/el nombre del negocio debe tener al menos 2 caracteres/i)
    ).toBeVisible({ timeout: 3000 })
  })

  test('Expand then collapse then submit - personal-only registration succeeds', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Fill personal fields
    await page.getByLabel(/nombre completo/i).fill('Test Personal User')
    await page.getByLabel(/email/i).first().fill(uniqueEmail())
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('DevTest123')
    await page.getByLabel(/confirmar contraseña/i).fill('DevTest123')

    // Expand business
    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'true')

    // Collapse (personal-only)
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'false')

    // Submit
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Success state (personal registration without business)
    await expect(page.getByText(/registro exitoso/i)).toBeVisible({ timeout: 10000 })
  })
})
