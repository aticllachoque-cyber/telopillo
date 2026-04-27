import { test, expect } from '@playwright/test'
import { login } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Edit Product Flow
// ---------------------------------------------------------------------------
test.describe.configure({ mode: 'serial' })
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

    await page.goto(`/productos/${productId}/editar`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /editar producto/i })).toBeVisible()
    // Edit wizard starts on Step 1 (Photos); navigate to Step 2 (Info) to check pre-fill
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
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

    const href = await productLink.getAttribute('href')
    const productId = href?.split('/productos/')[1]?.split('/')[0]
    if (!productId) {
      test.skip()
      return
    }

    await page.goto(`/productos/${productId}/editar`)
    await page.waitForLoadState('networkidle')

    const newTitle = `E2E Edit Test ${Date.now()}`
    const newPrice = '9999'

    // Edit wizard starts on Step 1 (Photos); advance to Step 2 (Info)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/título del producto/i).fill(newTitle)
    await page.getByRole('button', { name: /siguiente/i }).click() // Step 2 → Step 3
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill(newPrice)
    await page.getByRole('button', { name: /siguiente/i }).click() // Step 3 → Step 4
    await page.waitForLoadState('networkidle')
    // Intercept the Supabase PATCH call to confirm save fires
    const saveResponse = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/products') && resp.request().method() === 'PATCH',
      { timeout: 15000 }
    )
    await page.getByRole('button', { name: /guardar cambios/i }).click()
    await saveResponse

    // Wait for SPA navigation away from /editar (router.push uses history.pushState)
    await page.waitForFunction(() => !window.location.href.includes('/editar'), { timeout: 5000 })
    await expect(page.getByText(newTitle).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Bs\s*9[,.]?999/).first()).toBeVisible({ timeout: 5000 })
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

    await page.goto(`/productos/${productId}/editar`)
    await page.waitForLoadState('networkidle')

    const newTitle = `Detail Verify ${Date.now()}`
    // Edit wizard starts on Step 1 (Photos); advance to Step 2 (Info)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/título del producto/i).fill(newTitle)
    await page.getByRole('button', { name: /siguiente/i }).click() // Step 2 → Step 3
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click() // Step 3 → Step 4
    await page.waitForLoadState('networkidle')
    // Intercept the Supabase PATCH call to confirm save fires
    const saveResponse = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/products') && resp.request().method() === 'PATCH',
      { timeout: 15000 }
    )
    await page.getByRole('button', { name: /guardar cambios/i }).click()
    await saveResponse

    // Wait for SPA navigation away from /editar (router.push uses history.pushState)
    await page.waitForFunction(() => !window.location.href.includes('/editar'), { timeout: 5000 })
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: newTitle })).toBeVisible(
      { timeout: 5000 }
    )
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

    const href = await productLink.getAttribute('href')
    const productId = href?.split('/productos/')[1]?.split('/')[0]
    if (!productId) {
      test.skip()
      return
    }

    await page.goto(`/productos/${productId}/editar`)
    await page.waitForLoadState('networkidle')

    // Edit wizard starts on Step 1 (Photos); advance to Step 2 (Info)
    await page.getByRole('button', { name: /siguiente/i }).click()
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
        .getByText(/producto no encontrado/i)
        .or(page.getByRole('heading', { name: /error/i }))
        .first()
    ).toBeVisible({ timeout: 5000 })
  })
})
