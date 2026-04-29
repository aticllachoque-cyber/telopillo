import { authenticatedTest as test, expect } from '../../fixtures'

/**
 * Visual regression / structure check for the mobile slide-over drawer:
 * Marketplace (browse) vs Publicaciones (profile listings) vs Cuenta (account).
 */
test.describe('Mobile navigation drawer sections', () => {
  test('authenticated menu shows Marketplace, Publicaciones, Cuenta blocks', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await expect(page.locator('#mobile-nav-dialog')).toBeVisible()

    await expect(page.locator('#mobile-nav-marketplace-heading')).toBeVisible()
    await expect(page.locator('#mobile-nav-publications-heading')).toBeVisible()
    await expect(page.locator('#mobile-nav-account-heading')).toBeVisible()

    const drawer = page.locator('#mobile-nav-dialog')
    await expect(drawer.getByRole('link', { name: 'Productos', exact: true })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Mis productos' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Perfil', exact: true })).toBeVisible()

    await page.screenshot({
      path: 'tests/screenshots/mobile-nav-drawer-sections.png',
      fullPage: true,
    })
  })
})
