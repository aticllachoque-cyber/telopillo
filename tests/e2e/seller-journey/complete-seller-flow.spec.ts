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
    test.setTimeout(120000)
    const uniqueSuffix = Date.now()
    const productTitle = `E2E Full Flow Product ${uniqueSuffix}`
    const initialPrice = '2500'
    const updatedPrice = '2750'

    await login(page)

    // Step 1: Create product via wizard
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Wizard Step 1: Photos (use gallery input with `multiple` attribute)
    const fileInput = page.locator('input[multiple][type="file"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG_BUFFER,
    })
    // Wait for Supabase upload to complete (remove button only appears when upload is done)
    await expect(page.getByRole('button', { name: /eliminar imagen/i }).first()).toBeAttached({
      timeout: 20000,
    })
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Wizard Step 2: Basic Info
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/título del producto/i).fill(productTitle)
    await page
      .getByRole('textbox', { name: /descripción \*/i })
      .fill(
        'Producto de prueba para flujo E2E completo. Incluye todas las características necesarias para validar el ciclo de vida.'
      )
    await page.getByTestId('category-electronics').click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Wizard Step 3: Details
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill(initialPrice)
    await page.locator('#condition-used_like_new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Wizard Step 4: Review
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /publicar producto/i }).click()

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 15000, waitUntil: 'commit' })
    const productUrl = page.url()
    const productId = productUrl.split('/productos/')[1]?.split('/')[0]?.split('?')[0]
    expect(productId).toBeTruthy()

    // Step 2: Verify in my products
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(productTitle).first()).toBeVisible()
    await expect(page.getByText(/Bs\s*2[,.]?500/).first()).toBeVisible()

    // Step 3: Verify in search
    await page.goto(`/buscar?q=${encodeURIComponent(productTitle)}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(productTitle).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Bs\s*2[,.]?500/)).toBeVisible()

    // Step 4: Edit price
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    // Click the actions button for the specific product using its title in the accessible name
    await page
      .getByRole('button', { name: new RegExp(`acciones para ${productTitle}`, 'i') })
      .click()
    await page.getByRole('menuitem', { name: /editar/i }).click()

    await page.waitForURL(`**/productos/${productId}/editar**`, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Edit wizard: Step 1(Photos) → Step 2(Info) → Step 3(Details) → Step 4(Review)
    await page.getByRole('button', { name: /siguiente/i }).click() // step 1 → 2
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /siguiente/i }).click() // step 2 → 3
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill(updatedPrice)
    await page.getByRole('button', { name: /siguiente/i }).click() // step 3 → 4
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

    // Step 5: Verify updated price on detail page
    await expect(page.getByText(/Bs\s*2[,.]?750/).first()).toBeVisible({ timeout: 5000 })

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
      // After marking as sold the app may navigate; wait for loading to settle
      await expect(page.getByText(/cargando/i)).not.toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/vendido/i).first()).toBeVisible({ timeout: 10000 })
    }

    // Step 7: Cleanup - delete product
    await page.goto('/perfil/mis-productos')
    await page.waitForLoadState('networkidle')

    const actionsBtn = page.getByRole('button', {
      name: new RegExp(`acciones para ${productTitle}`, 'i'),
    })
    if (await actionsBtn.isVisible()) {
      await actionsBtn.click()
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
