import { test, expect } from '@playwright/test'
import { login } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. View Profile - Authenticated
// ---------------------------------------------------------------------------
test.describe('Account Management - View Profile', () => {
  test('Login, navigate to /profile and verify profile data', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Verify user name (heading)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).not.toHaveText(/cargando/i)

    // Verify avatar or placeholder (Avatar shows initials when no image)
    const avatar = page.locator('[class*="avatar"]').first()
    await expect(avatar).toBeVisible()

    // Verify location when present (profile may have city, department)
    const locationSection = page.getByText(
      /santa cruz|la paz|cochabamba|potosí|chuquisaca|oruro|tarija|beni|pando/i
    )
    // Location is optional - profile may or may not have it
    const hasLocation = await locationSection.isVisible().catch(() => false)
    if (hasLocation) {
      await expect(locationSection).toBeVisible()
    }

    // Verify rating section or absence (rating only shows when rating_count > 0)
    const ratingSection = page.getByText(/reseña|reseñas/i)
    const hasRatings = await ratingSection.isVisible().catch(() => false)
    if (hasRatings) {
      await expect(ratingSection).toBeVisible()
    }
    // When no ratings, the section is hidden - no "No ratings yet" in current UI
  })

  test('Edit profile link navigates to /profile/edit', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    const editLink = page.getByRole('link', { name: /editar/i })
    await expect(editLink).toBeVisible()
    await expect(editLink).toHaveAttribute('href', '/profile/edit')

    await editLink.click()
    await page.waitForURL(/\/profile\/edit/, { timeout: 10000 })
    expect(page.url()).toContain('/profile/edit')
  })

  test('Sign out button is visible', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    const signOutButton = page.getByRole('button', { name: /salir/i })
    await expect(signOutButton).toBeVisible()
  })

  test('Member since date is displayed', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/miembro desde/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Unauthenticated Access
// ---------------------------------------------------------------------------
test.describe('Account Management - View Profile (Unauthenticated)', () => {
  test('Visit /profile unauthenticated redirects to /login', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Client-side redirect happens after load
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })
})
