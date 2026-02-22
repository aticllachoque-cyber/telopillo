/**
 * Comprehensive Auth Flows E2E Test
 * Run: npx playwright test tests/e2e/auth/auth-flows-comprehensive.spec.ts
 *
 * Covers: Register, Login, Forgot Password, OAuth buttons, Protected redirects, Login+Profile
 * Viewports: Mobile 375x812, Desktop 1280x720
 */

import { test, expect } from '@playwright/test'
import { login, assertNoHorizontalScroll } from '../../helpers'

// ---------------------------------------------------------------------------
// FLOW 2.1 - REGISTER FORM
// ---------------------------------------------------------------------------
test.describe('Flow 2.1 - Register Form', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('2.1.1-2: Register page has 4 fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/contraseña/i).first()).toBeVisible()
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible()
  })

  test('2.1.3: Business toggle exists', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('button', { name: /¿tienes un negocio/i })).toBeVisible()
  })

  test('2.1.4-5: OAuth buttons exist and have min-h-[44px]', async ({ page }) => {
    await page.goto('/register')
    const googleBtn = page.getByRole('button', { name: /continuar con google/i })
    const fbBtn = page.getByRole('button', { name: /continuar con facebook/i })
    await expect(googleBtn).toBeVisible()
    await expect(fbBtn).toBeVisible()

    const heights = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label*="Continuar"]')
      return Array.from(btns).map((b) => b.getBoundingClientRect().height)
    })
    heights.forEach((h) => expect(h).toBeGreaterThanOrEqual(44))
  })

  test('2.1.6: Empty form shows validation errors in Spanish', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: /crear cuenta/i }).click()
    await expect(page.getByText(/inválido|caracteres|requerida/i).first()).toBeVisible({
      timeout: 3000,
    })
  })

  test('2.1.7-9: Invalid data shows field-level errors in Spanish', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel(/nombre completo/i).fill('A')
    await page.getByLabel(/email/i).first().fill('bad')
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('12')
    await page.getByLabel(/confirmar contraseña/i).fill('34')
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Zod shows validation errors; at least one Spanish error must appear
    await expect(page.getByText(/inválido|caracteres|mayúscula|número|coinciden/i)).toBeVisible({
      timeout: 5000,
    })

    await page.screenshot({ path: 'tests/screenshots/mobile-register-validation.png' })
  })

  test('2.1 overflow: No horizontal overflow', async ({ page }) => {
    await page.goto('/register')
    await assertNoHorizontalScroll(page)
  })
})

// ---------------------------------------------------------------------------
// FLOW 2.2 - LOGIN FORM
// ---------------------------------------------------------------------------
test.describe('Flow 2.2 - Login Form', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('2.2.10-11: Login page has Email and Contraseña', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('2.2.12-13: Submit and OAuth buttons have correct height', async ({ page }) => {
    await page.goto('/login')
    const submitBtn = page.locator('#main-content button[type="submit"]')
    await expect(submitBtn).toHaveClass(/h-11/)

    const oauthHeights = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label*="Continuar"]')
      return Array.from(btns).map((b) => b.getBoundingClientRect().height)
    })
    oauthHeights.forEach((h) => expect(h).toBeGreaterThanOrEqual(44))
  })

  test('2.2.14: Empty form shows validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#main-content button[type="submit"]').click()
    await expect(page.getByText(/email inválido|la contraseña es requerida/i).first()).toBeVisible({
      timeout: 3000,
    })
  })

  test('2.2.15-17: Wrong credentials show Spanish error (not English)', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@bad.com')
    await page.getByLabel(/contraseña/i).fill('wrongpass')
    await page.locator('#main-content button[type="submit"]').click()

    await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/invalid login credentials/i)).not.toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/mobile-login-validation.png' })
  })
})

// ---------------------------------------------------------------------------
// FLOW 2.3 - FORGOT PASSWORD
// ---------------------------------------------------------------------------
test.describe('Flow 2.3 - Forgot Password', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('2.3.18-20: Forgot password has email field and h-11 submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    const submitBtn = page.getByRole('button', { name: /enviar link/i })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toHaveClass(/h-11/)
  })

  test('2.3.21: Empty submit shows validation error', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByRole('button', { name: /enviar link/i }).click()
    await expect(page.getByText(/email inválido/i)).toBeVisible({ timeout: 3000 })
  })

  test('2.3.22-23: Valid email shows success message', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /enviar link/i }).click()

    // Supabase sends email; success UI shows "Email Enviado" or "Revisa tu email"
    await expect(page.getByText(/email enviado|revisa tu email/i)).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'tests/screenshots/mobile-forgot-password.png' })
  })
})

// ---------------------------------------------------------------------------
// FLOW 2.4 - OAUTH BUTTONS HEIGHT CHECK
// ---------------------------------------------------------------------------
test.describe('Flow 2.4 - OAuth Buttons Height', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('2.4.24: Login OAuth buttons offsetHeight >= 44', async ({ page }) => {
    await page.goto('/login')
    const heights = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label*="Continuar"]')
      return Array.from(btns).map((b) => (b as HTMLElement).offsetHeight)
    })
    expect(heights.length).toBe(2)
    heights.forEach((h) => expect(h).toBeGreaterThanOrEqual(44))
  })

  test('2.4.25: Register OAuth buttons offsetHeight >= 44', async ({ page }) => {
    await page.goto('/register')
    const heights = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label*="Continuar"]')
      return Array.from(btns).map((b) => (b as HTMLElement).offsetHeight)
    })
    expect(heights.length).toBe(2)
    heights.forEach((h) => expect(h).toBeGreaterThanOrEqual(44))
  })
})

// ---------------------------------------------------------------------------
// FLOW 2.5 - PROTECTED REDIRECTS (use storageState: { cookies: [], origins: [] } for incognito)
// ---------------------------------------------------------------------------
test.describe('Flow 2.5 - Protected Redirects', () => {
  test.use({ storageState: { cookies: [], origins: [] } }) // Incognito - no auth

  const protectedRoutes = [
    { path: '/busco/publicar', name: 'busco/publicar' },
    { path: '/perfil/demandas', name: 'perfil/demandas' },
    { path: '/publicar', name: 'publicar' },
    { path: '/profile', name: 'profile' },
    { path: '/profile/edit', name: 'profile/edit' },
    { path: '/perfil/mis-productos', name: 'perfil/mis-productos' },
  ]

  for (const { path, name } of protectedRoutes) {
    test(`2.5: ${name} redirects to /login with redirect param`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      expect(page.url()).toContain('redirect=')
    })
  }
})

// ---------------------------------------------------------------------------
// FLOW 2.6 - LOGIN + PROFILE EDIT
// ---------------------------------------------------------------------------
test.describe('Flow 2.6 - Login + Profile Edit', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('2.6.34-39: Login and profile edit form', async ({ page }) => {
    await login(page)
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/teléfono/i)).toBeVisible()
    await expect(page.getByLabel(/departamento/i)).toBeVisible()
    await expect(page.getByLabel(/ciudad/i)).toBeVisible()
    await expect(page.getByText(/foto de perfil/i)).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/mobile-profile-edit.png' })
  })
})

// ---------------------------------------------------------------------------
// OVERFLOW CHECK - All auth pages at 375px
// ---------------------------------------------------------------------------
test.describe('Overflow Check - Auth Pages', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  const authPages = ['/login', '/register', '/forgot-password']

  for (const path of authPages) {
    test(`No horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path)
      await assertNoHorizontalScroll(page)
    })
  }
})
