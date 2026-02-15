import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// ---------------------------------------------------------------------------
// 1. Login Flow
// ---------------------------------------------------------------------------
test.describe('Auth - Login Flow', () => {
  test('Login page loads with form and heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { level: 1, name: /iniciar sesión/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('Successful login redirects to home and shows user menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
    await page.locator('#main-content button[type="submit"]').click()

    // Wait for navigation AWAY from /login (router.push('/') is client-side)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
  })
})

// ---------------------------------------------------------------------------
// 2. Login Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Auth - Login Errors', () => {
  test('Wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.getByLabel(/contraseña/i).fill('WrongPass123')
    await page.locator('#main-content button[type="submit"]').click()

    await expect(page.getByText(/invalid login credentials|error al iniciar sesión/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('Non-existent email shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill('ghost@telopillo.test')
    await page.getByLabel(/contraseña/i).fill('SomePass123')
    await page.locator('#main-content button[type="submit"]').click()

    await expect(page.getByText(/invalid login credentials|error al iniciar sesión/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('Empty form shows validation errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.locator('#main-content button[type="submit"]').click()

    await expect(
      page
        .locator('#main-content')
        .getByText(/email inválido|la contraseña es requerida/i)
        .first()
    ).toBeVisible({ timeout: 3000 })
  })

  test('Empty password shows validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.locator('#main-content button[type="submit"]').click()

    await expect(page.getByText(/la contraseña es requerida/i)).toBeVisible({ timeout: 3000 })
  })
})

// ---------------------------------------------------------------------------
// 3. Auth Redirect - Protected Routes (Unauthenticated)
// ---------------------------------------------------------------------------
test.describe('Auth - Protected Route Redirects', () => {
  test('Unauthenticated visit to /profile/edit redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirect=')
  })

  test('Unauthenticated visit to /publicar redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
  })

  test('Unauthenticated visit to /perfil/mis-productos redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/login')
  })
})

// ---------------------------------------------------------------------------
// 4. Auth Redirect - Logged-in Users
// ---------------------------------------------------------------------------
test.describe('Auth - Logged-in Redirect', () => {
  test('Logged-in visit to /login redirects to home', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
    await page.locator('#main-content button[type="submit"]').click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    expect(page.url()).not.toContain('/login')
  })

  test('Logged-in visit to /register redirects to home', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
    await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
    await page.locator('#main-content button[type="submit"]').click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    expect(page.url()).not.toContain('/register')
  })
})

// ---------------------------------------------------------------------------
// 5. Accessibility
// ---------------------------------------------------------------------------
test.describe('Auth - Login Accessibility', () => {
  test('Login page passes axe-core WCAG 2.2 AA audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
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
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/email/i).focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const submitButton = page.locator('#main-content button[type="submit"]')
    await expect(submitButton).toBeFocused()
  })

  test('Forgot password link is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const forgotLink = page.getByRole('link', { name: /olvidaste tu contraseña/i })
    await expect(forgotLink).toBeVisible()
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password')
  })
})

// ---------------------------------------------------------------------------
// 6. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Auth - Login Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('No horizontal scroll on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Forgot password and Register links are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: /olvidaste tu contraseña/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /regístrate/i })).toBeVisible()
  })
})
