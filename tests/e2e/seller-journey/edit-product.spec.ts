import { test, expect } from '@playwright/test'
import { login } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Edit Product Flow
// ---------------------------------------------------------------------------
test.describe('Edit Product - Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Edit form is pre-filled with product data', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    const count = await productLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    const href = await productLink.getAttribute('href')
    const productId = href?.split('/productos/')[1]?.split('/')[0]
    if (!productId) {
      test.skip()
      return
    }

    await page
      .getByRole('button', { name: /acciones/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await page.waitForURL(`**/productos/${productId}/editar**`, { timeout: 10000 })

    await expect(page.getByRole('heading', { name: /editar producto/i })).toBeVisible()
    const titleInput = page.getByLabel(/título del producto/i)
    await expect(titleInput).toBeVisible()
    await expect(titleInput).not.toHaveValue('')
  })

  test('Modifying title and price saves successfully', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    const count = await productLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    await page
      .getByRole('button', { name: /acciones/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await page.waitForURL('**/productos/**/editar**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const newTitle = `E2E Edit Test ${Date.now()}`
    const newPrice = '9999'

    await page.getByLabel(/título del producto/i).fill(newTitle)
    await page.getByLabel(/precio \(bob\)/i).fill(newPrice)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /guardar cambios/i }).click()

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 15000 })
    expect(page.url()).not.toContain('/editar')
    await expect(page.getByText(newTitle)).toBeVisible()
    await expect(page.getByText(/Bs\s*9[,.]?999/)).toBeVisible()
  })

  test('Changes are visible on product detail page after save', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    const count = await productLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    const href = await productLink.getAttribute('href')
    const productId = href?.split('/productos/')[1]?.split('/')[0]
    if (!productId) {
      test.skip()
      return
    }

    await page
      .getByRole('button', { name: /acciones/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await page.waitForURL(`**/productos/${productId}/editar**`, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const newTitle = `Detail Verify ${Date.now()}`
    await page.getByLabel(/título del producto/i).fill(newTitle)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /guardar cambios/i }).click()

    await page.waitForURL(new RegExp(`/productos/${productId}`), { timeout: 15000 })
    await expect(
      page.getByRole('heading', { level: 1 }).filter({ hasText: newTitle })
    ).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Validation Errors
// ---------------------------------------------------------------------------
test.describe('Edit Product - Validation Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Shows validation error when clearing required title', async ({ page }) => {
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    const count = await productLink.count()
    if (count === 0) {
      test.skip()
      return
    }

    await page
      .getByRole('button', { name: /acciones/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await page.waitForURL('**/productos/**/editar**', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).clear()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/título debe tener al menos 10 caracteres/i)).toBeVisible({
      timeout: 3000,
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Edit Product - Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Shows error for non-existent product ID', async ({ page }) => {
    await page.goto('/productos/00000000-0000-0000-0000-000000000000/editar')
    await page.waitForLoadState('networkidle')

    await expect(
      page
        .getByText(/producto no encontrado|error/i)
        .or(page.getByRole('heading', { name: /error/i }))
    ).toBeVisible({ timeout: 5000 })
  })
})
