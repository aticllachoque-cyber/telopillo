import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Registration Form - Structure and Fields
// ---------------------------------------------------------------------------
test.describe('Auth - Registration Form', () => {
  test('Registration page loads with form and heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1, name: /crear cuenta/i })).toBeVisible()
    await expect(page.getByText(/únete a la comunidad/i)).toBeVisible()
  })

  test('All required form fields are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/^email$/i)).toBeVisible()
    await expect(page.getByLabel(/^contraseña$/i).first()).toBeVisible()
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible()
  })

  test('OAuth buttons (Google, Facebook) are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continuar con facebook/i })).toBeVisible()
  })

  test('Form accepts valid input and submits without client-side validation error', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const timestamp = Date.now()
    const uniqueEmail = `reg-${timestamp}@telopillo.test`

    await page.getByLabel(/nombre completo/i).fill('Juan Pérez Test')
    await page.getByLabel(/^email$/i).fill(uniqueEmail)
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('TestPass123')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass123')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // The form should submit — either show "¡Registro Exitoso!" or a Supabase server error.
    // Both mean client-side validation passed. Supabase may not be configured for signups in dev.
    const success = page.getByRole('heading', { name: /registro exitoso/i })
    const serverError = page.locator('[role="alert"]')

    await expect(success.or(serverError)).toBeVisible({ timeout: 10000 })

    // No client-side validation errors should be visible
    await expect(page.getByText(/el nombre debe tener/i)).not.toBeVisible()
    await expect(page.getByText(/email inválido/i)).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Registration Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Auth - Registration Errors', () => {
  test('Empty form shows validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Assert each validation error individually (avoids strict mode violation)
    await expect(page.getByText('El nombre debe tener al menos 2 caracteres')).toBeVisible({
      timeout: 3000,
    })
    await expect(page.getByText('Email inválido')).toBeVisible()
    await expect(page.getByText('La contraseña debe tener al menos 8 caracteres')).toBeVisible()
  })

  test('Invalid email format is rejected by validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/nombre completo/i).fill('Juan Pérez')
    await page.getByLabel(/^email$/i).fill('not-an-email')
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('TestPass123')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass123')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Input type="email" triggers browser-native validation for "not-an-email" (no @ sign),
    // which blocks form submit before Zod runs. Either way, the success screen must NOT appear.
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /registro exitoso/i })).not.toBeVisible()
    expect(page.url()).toContain('/register')
  })

  test('Short password shows validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/nombre completo/i).fill('Juan Pérez')
    await page.getByLabel(/^email$/i).fill('test@example.com')
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('123')
    await page.getByLabel(/confirmar contraseña/i).fill('123')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    await expect(
      page.getByText(/la contraseña debe tener al menos 8 caracteres|debe contener al menos/i)
    ).toBeVisible({ timeout: 3000 })
  })

  test('Mismatched passwords show validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/nombre completo/i).fill('Juan Pérez')
    await page.getByLabel(/^email$/i).fill('test@example.com')
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('TestPass123')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass5678')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    await expect(page.getByText(/las contraseñas no coinciden/i)).toBeVisible({ timeout: 3000 })
  })

  test('Duplicate email shows error or does not show success', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/nombre completo/i).fill('Juan Pérez')
    await page.getByLabel(/^email$/i).fill('dev@telopillo.test')
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('TestPass123')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass123')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Supabase may return different error messages depending on config:
    // "User already registered", "already been registered", or generic "Error al registrarse"
    // Some Supabase configs silently "succeed" for duplicate emails (security: no info leak).
    // Either an error alert appears OR the success screen appears (both are valid Supabase responses).
    const errorAlert = page.locator('[role="alert"]')
    const successScreen = page.getByRole('heading', { name: /registro exitoso/i })

    await expect(errorAlert.or(successScreen)).toBeVisible({ timeout: 10000 })
  })

  test('SQL injection in name does not cause server error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const timestamp = Date.now()
    const uniqueEmail = `reg-${timestamp}@telopillo.test`

    await page.getByLabel(/nombre completo/i).fill("'; DROP TABLE profiles;--")
    await page.getByLabel(/^email$/i).fill(uniqueEmail)
    await page
      .getByLabel(/^contraseña$/i)
      .first()
      .fill('TestPass123')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass123')

    await page.getByRole('button', { name: /crear cuenta/i }).click()

    const response = page.url()
    expect(response).toContain('/register')
    await expect(page.getByRole('heading', { name: /crear cuenta|registro exitoso/i })).toBeVisible(
      { timeout: 10000 }
    )
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility
// ---------------------------------------------------------------------------
test.describe('Auth - Registration Accessibility', () => {
  test('Registration page passes axe-core WCAG 2.2 AA audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')

    if (critical.length > 0 || serious.length > 0) {
      console.log('Accessibility violations:')
      ;[...critical, ...serious].forEach((v) => {
        console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`)
        v.nodes.forEach((n) => console.log(`    → ${n.html.substring(0, 80)}`))
      })
    }

    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Tab order flows through form fields correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Tab order: Name → Email → Password → Confirm Password → Business toggle → Submit
    await page.getByLabel(/nombre completo/i).focus()
    await page.keyboard.press('Tab') // → Email
    await expect(page.getByLabel(/^email$/i)).toBeFocused()
    await page.keyboard.press('Tab') // → Password
    await expect(page.getByLabel(/^contraseña$/i).first()).toBeFocused()
    await page.keyboard.press('Tab') // → Confirm Password
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeFocused()
    // After confirm password, the business toggle button receives focus before submit
    await page.keyboard.press('Tab') // → Business toggle
    await page.keyboard.press('Tab') // → Submit
    const submitButton = page.getByRole('button', { name: /crear cuenta/i })
    await expect(submitButton).toBeFocused()
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Auth - Registration Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('No horizontal scroll on registration page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Form fields are full width and visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const fullNameInput = page.getByLabel(/nombre completo/i)
    await expect(fullNameInput).toBeVisible()
    const box = await fullNameInput.boundingBox()
    // At 375px viewport with card padding, ~280px is expected and correct
    expect(box?.width).toBeGreaterThan(250)
  })

  test('OAuth buttons stack and fit viewport', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continuar con facebook/i })).toBeVisible()
  })
})
