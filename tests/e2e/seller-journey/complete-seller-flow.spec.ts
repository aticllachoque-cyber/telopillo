import { test, expect } from '@playwright/test'
import { login } from '../../helpers'

const MINIMAL_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

// ---------------------------------------------------------------------------
// 1. Complete Seller Flow - Full Lifecycle
// ---------------------------------------------------------------------------
test.describe('Complete Seller Flow - Full Lifecycle', () => {
  test('Full seller journey: create → my products → search → edit → verify', async ({ page }) => {
    const uniqueSuffix = Date.now()
    const productTitle = `E2E Full Flow Product ${uniqueSuffix}`
    const initialPrice = '2500'
    const updatedPrice = '2750'

    await login(page)

    // Step 1: Create product via wizard
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill(productTitle)
    await page
      .getByRole('textbox', { name: /descripción \*/i })
      .fill(
        'Producto de prueba para flujo E2E completo. Incluye todas las características necesarias para validar el ciclo de vida.'
      )
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill(initialPrice)
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /como nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.getByLabel(/ciudad/i).fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG_BUFFER,
    })
    await expect(page.getByText(/subiendo/i)).not.toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /publicar producto/i }).click()

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 15000 })
    const productUrl = page.url()
    const productId = productUrl.split('/productos/')[1]?.split('/')[0]?.split('?')[0]
    expect(productId).toBeTruthy()

    // Step 2: Verify in my products
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(productTitle)).toBeVisible()
    await expect(page.getByText(/Bs\s*2[,.]?500/)).toBeVisible()

    // Step 3: Verify in search
    await page.goto(`/buscar?q=${encodeURIComponent(productTitle)}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(productTitle).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Bs\s*2[,.]?500/)).toBeVisible()

    // Step 4: Edit price
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const productCard = page.locator(`a[href*="/productos/${productId}"]`).first()
    await productCard.scrollIntoViewIfNeeded()
    await page
      .getByRole('button', { name: /acciones/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()

    await page.waitForURL(`**/productos/${productId}/editar**`, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/precio \(bob\)/i).fill(updatedPrice)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /guardar cambios/i }).click()

    await page.waitForURL(new RegExp(`/productos/${productId}`), { timeout: 15000 })

    // Step 5: Verify updated price on detail page
    await expect(page.getByText(/Bs\s*2[,.]?750/)).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1 }).filter({ hasText: productTitle })
    ).toBeVisible()

    // Step 6: Mark as sold (if UI exists)
    await page.goto(`/productos/${productId}`)
    await page.waitForLoadState('networkidle')

    const markSoldBtn = page.getByRole('button', { name: /marcar como vendido/i })
    if (await markSoldBtn.isVisible()) {
      await markSoldBtn.click()
      await page
        .getByRole('button', { name: /marcar como vendido/i })
        .last()
        .click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/vendido/i)).toBeVisible({ timeout: 5000 })
    }

    // Step 7: Cleanup - delete product
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const ourProductCard = page.locator(`a[href*="/productos/${productId}"]`).first()
    if (await ourProductCard.isVisible()) {
      await ourProductCard.getByRole('button', { name: /acciones/i }).click()
      const deleteItem = page.getByRole('menuitem', { name: /eliminar/i })
      if (await deleteItem.isVisible()) {
        await deleteItem.click()
        await page
          .getByRole('button', { name: /eliminar/i })
          .last()
          .click()
        await page.waitForLoadState('networkidle')
      }
    }
  })
})
