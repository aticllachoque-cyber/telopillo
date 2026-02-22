/**
 * Auth flows test - Mobile 375x812
 * Covers: Register, Login, Forgot Password, Protected Redirects, Login+Profile
 */
import { test, expect } from '@playwright/test'
import { login, assertNoHorizontalScroll } from '../../helpers'

test.describe('Auth Flows - Mobile 375x812', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  // FLOW 2.1 - REGISTER
  test.describe('FLOW 2.1 - REGISTER', () => {
    test('1. Register page loads with all fields', async ({ page }) => {
      await page.goto('/register')
      await page.waitForLoadState('networkidle')

      await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
      await expect(page.getByLabel(/^email$/i)).toBeVisible()
      await expect(page.getByLabel(/^contraseña$/i).first()).toBeVisible()
      await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible()
      await assertNoHorizontalScroll(page)
    })

    test('2. Business toggle exists', async ({ page }) => {
      await page.goto('/register')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('button', { name: /¿tienes un negocio/i })).toBeVisible()
      await assertNoHorizontalScroll(page)
    })

    test('3. OAuth buttons have min-h-[44px]', async ({ page }) => {
      await page.goto('/register')
      await page.waitForLoadState('networkidle')

      const googleBtn = page.getByRole('button', { name: /continuar con google/i })
      await expect(googleBtn).toBeVisible()
      const classes = await googleBtn.getAttribute('class')
      expect(classes).toContain('min-h-[44px]')
    })

    test('4. Empty form shows Spanish validation errors', async ({ page }) => {
      await page.goto('/register')
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: /crear cuenta/i }).click()

      // At least one of these Spanish validation messages must appear
      await expect(
        page
          .locator('#main-content')
          .getByText(/el nombre debe tener|email inválido|la contraseña debe tener al menos 8/i)
          .first()
      ).toBeVisible({ timeout: 5000 })
      await assertNoHorizontalScroll(page)
    })

    test('5. Screenshot mobile-register-validation', async ({ page }) => {
      await page.goto('/register')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: /crear cuenta/i }).click()
      await page.waitForTimeout(800)
      await expect(
        page
          .locator('#main-content')
          .getByText(/el nombre debe tener|email inválido|la contraseña debe tener al menos 8/i)
          .first()
      ).toBeVisible({ timeout: 5000 })
      await page.screenshot({ path: 'test-results/mobile-register-validation.png' })
    })
  })

  // FLOW 2.2 - LOGIN
  test.describe('FLOW 2.2 - LOGIN', () => {
    test('6. Login page loads', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalScroll(page)
    })

    test('7. Submit button has h-11 (44px)', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      const submitBtn = page.locator('#main-content button[type="submit"]')
      await expect(submitBtn).toBeVisible()
      const classes = await submitBtn.getAttribute('class')
      expect(classes).toContain('h-11')
    })

    test('8. OAuth buttons have min-h-[44px]', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      const googleBtn = page.getByRole('button', { name: /continuar con google/i })
      await expect(googleBtn).toBeVisible()
      const classes = await googleBtn.getAttribute('class')
      expect(classes).toContain('min-h-[44px]')
    })

    test('9. Empty form shows Spanish errors', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      await page.locator('#main-content button[type="submit"]').click()

      await expect(
        page
          .locator('#main-content')
          .getByText(/email inválido|la contraseña es requerida/i)
          .first()
      ).toBeVisible({ timeout: 3000 })
    })

    test('10. Wrong credentials show Spanish error (NOT English)', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      await page.getByLabel(/email/i).fill('test@bad.com')
      await page.getByLabel(/contraseña/i).fill('wrongpass')
      await page.locator('#main-content button[type="submit"]').click()

      // Error appears in role="alert" - must be Spanish, not raw "Invalid login credentials"
      const errorEl = page.locator('[role="alert"]').filter({ hasText: /./ })
      await expect(errorEl).toBeVisible({ timeout: 8000 })
      const text = (await errorEl.textContent()) ?? ''
      expect(text).not.toContain('Invalid login credentials')
      expect(text.toLowerCase()).toMatch(/email|contraseña|incorrecto|error|sesión/i)
    })

    test('11. Screenshot mobile-login-errors', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      await page.getByLabel(/email/i).fill('test@bad.com')
      await page.getByLabel(/contraseña/i).fill('wrongpass')
      await page.locator('#main-content button[type="submit"]').click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/mobile-login-errors.png' })
    })
  })

  // FLOW 2.3 - FORGOT PASSWORD
  test.describe('FLOW 2.3 - FORGOT PASSWORD', () => {
    test('12. Forgot password page loads', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalScroll(page)
    })

    test('13. Submit button has h-11', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      const submitBtn = page.getByRole('button', { name: /enviar link de restablecimiento/i })
      await expect(submitBtn).toBeVisible()
      const classes = await submitBtn.getAttribute('class')
      expect(classes).toContain('h-11')
    })

    test('14. Empty submit shows error', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: /enviar link de restablecimiento/i }).click()

      await expect(page.getByText(/email inválido/i)).toBeVisible({ timeout: 3000 })
    })

    test('15. Screenshot mobile-forgot-password', async ({ page }) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: 'test-results/mobile-forgot-password.png' })
    })
  })

  // FLOW 2.4 - PROTECTED REDIRECTS
  test.describe('FLOW 2.4 - PROTECTED REDIRECTS', () => {
    test('16. /busco/publicar redirects to login with redirect param', async ({ page }) => {
      await page.goto('/busco/publicar')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      expect(page.url()).toContain('redirect=')
      await assertNoHorizontalScroll(page)
    })

    test('17. /perfil/demandas redirects to login', async ({ page }) => {
      await page.goto('/perfil/demandas')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      await assertNoHorizontalScroll(page)
    })

    test('18. /publicar redirects to login', async ({ page }) => {
      await page.goto('/publicar')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      await assertNoHorizontalScroll(page)
    })

    test('19. /profile redirects to login', async ({ page }) => {
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      await assertNoHorizontalScroll(page)
    })

    test('20. /profile/edit redirects to login', async ({ page }) => {
      await page.goto('/profile/edit')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      await assertNoHorizontalScroll(page)
    })

    test('21. /perfil/mis-productos redirects to login', async ({ page }) => {
      await page.goto('/perfil/mis-productos')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/login')
      await assertNoHorizontalScroll(page)
    })
  })

  // FLOW 2.5 - LOGIN + PROFILE
  test.describe('FLOW 2.5 - LOGIN + PROFILE', () => {
    test('22. Login with dev user and navigate to profile/edit', async ({ page }) => {
      await login(page)
      await page.goto('/profile/edit')
      await page.waitForLoadState('networkidle')

      expect(page.url()).toContain('/profile/edit')
      await assertNoHorizontalScroll(page)
    })

    test('23. Profile edit has name, phone, location fields', async ({ page }) => {
      await login(page)
      await page.goto('/profile/edit')
      await page.waitForLoadState('networkidle')

      await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
      await expect(page.getByRole('textbox', { name: /teléfono \(opcional\)/i })).toBeVisible()
      await expect(page.getByLabel(/departamento/i)).toBeVisible()
    })

    test('24. Screenshot mobile-profile-edit', async ({ page }) => {
      await login(page)
      await page.goto('/profile/edit')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/mobile-profile-edit.png' })
    })
  })
})
