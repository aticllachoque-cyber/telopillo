import { test, expect, type Page } from '@playwright/test'
import { login, runAxeAudit } from '../../helpers'

// Minimal 1x1 PNG for image upload tests
const MINIMAL_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

// Helper: upload minimal image on Step 1 (Photos) and advance to Step 2 (Info)
async function uploadPhotoAndProceed(page: Page) {
  // Use the gallery input (has `multiple` attribute) not the camera capture input
  const fileInput = page.locator('input[multiple][type="file"]')
  await fileInput.setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: MINIMAL_PNG_BUFFER,
  })
  // Wait for Supabase upload to complete.
  // The "Eliminar imagen" button only renders when `preview.uploading === false`,
  // making it a reliable signal that the upload has finished and the URL is in form state.
  await expect(page.getByRole('button', { name: /eliminar imagen/i }).first()).toBeAttached({
    timeout: 20000,
  })
  await page.getByRole('button', { name: /siguiente/i }).click()
  await expect(page.getByRole('heading', { name: /información básica/i })).toBeVisible({
    timeout: 5000,
  })
}

async function selectElectronicsCategory(page: Page) {
  const mobileTrigger = page.locator('#category')
  if (await mobileTrigger.isVisible().catch(() => false)) {
    await mobileTrigger.click()
    await page.getByRole('option', { name: /electrónica y tecnología/i }).click()
    return
  }

  const desktopCategory = page.getByTestId('category-electronics')
  await desktopCategory.scrollIntoViewIfNeeded()
  await expect(desktopCategory).toBeVisible()
  await desktopCategory.click()
}

// ---------------------------------------------------------------------------
// 1. Create Product - Wizard Flow
// ---------------------------------------------------------------------------
test.describe('Create Product - Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Wizard Step 1 is visible after navigating to /publicar', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /publicar producto/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /fotos del producto/i })).toBeVisible()
    const fileInput = page.locator('input[multiple][type="file"]')
    await expect(fileInput).toBeAttached()
    await expect(fileInput).toHaveAttribute('accept', /image\/heic/)
    await expect(fileInput).toHaveAttribute('accept', /image\/heif/)
    await expect(page.getByText(/heic\/heif/i)).toBeVisible()
  })

  test('Completes full wizard and publishes product', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Step 1: Photos
    await uploadPhotoAndProceed(page)

    // Step 2: Basic Info
    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB - Test E2E')
    await page
      .getByRole('textbox', { name: /descripción \*/i })
      .fill(
        'iPhone 13 Pro Max en excelente estado. Incluye cargador y funda. Sin rayones en pantalla. Batería al 95%.'
      )
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: Details
    await expect(page.getByRole('heading', { name: /detalles del producto/i })).toBeVisible({
      timeout: 3000,
    })
    await page.getByLabel(/precio \(bob\)/i).fill('5000')
    await page.locator('#condition-used_like_new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 4: Review
    await expect(page.getByRole('heading', { name: /revisar y publicar/i })).toBeVisible({
      timeout: 3000,
    })
    await expect(page.getByText(/iPhone 13 Pro Max 256GB - Test E2E/i)).toBeVisible()
    await expect(page.getByText(/Bs\s*5[\d.,\s]*000/)).toBeVisible()
    await page.getByRole('button', { name: /publicar producto/i }).click()

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 15000, waitUntil: 'commit' })
    expect(page.url()).toContain('/productos/')
    await expect(
      page
        .getByRole('heading', { level: 1 })
        .filter({ hasText: /iPhone 13 Pro Max 256GB - Test E2E/i })
    ).toBeVisible()
    await expect(page.getByText(/Bs\s*5[\d.,\s]*000/).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Validation Errors
// ---------------------------------------------------------------------------
test.describe('Create Product - Validation Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Step 2 shows error when title is empty', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Navigate past Step 1 (Photos)
    await uploadPhotoAndProceed(page)

    // Leave title empty, fill the rest and click next
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/título debe tener al menos 10 caracteres/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('Step 2 shows error when category is not selected', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Navigate past Step 1 (Photos)
    await uploadPhotoAndProceed(page)

    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/selecciona una categoría/i)).toBeVisible({ timeout: 3000 })
  })

  test('Step 3 shows error for negative price', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Step 1: Photos
    await uploadPhotoAndProceed(page)

    // Step 2: Info
    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: Details - invalid price
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('-100')
    await page.locator('#condition-used_like_new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/precio debe ser mayor a 0/i)).toBeVisible({ timeout: 3000 })
  })

  test('Step 3 shows error for zero price', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Step 1: Photos
    await uploadPhotoAndProceed(page)

    // Step 2: Info
    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: Details - zero price
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('0')
    await page.locator('#condition-used_like_new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/precio debe ser mayor a 0/i)).toBeVisible({ timeout: 3000 })
  })

  test('Data is preserved when navigating back and forth between steps', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    const title = 'Test Product Title for Data Preservation'
    const description = 'A'.repeat(50)

    // Step 1: Photos
    await uploadPhotoAndProceed(page)

    // Step 2: Info
    await page.getByLabel(/título del producto/i).fill(title)
    await page.getByRole('textbox', { name: /descripción \*/i }).fill(description)
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: Details
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('1000')
    await page.locator('#condition-new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /santa cruz/i }).click()
    await page.locator('#location_city').fill('Santa Cruz')

    // Go back to Step 2 and verify data is retained
    await page.getByRole('button', { name: /anterior/i }).click()

    await expect(page.getByLabel(/título del producto/i)).toHaveValue(title)
    await expect(page.getByRole('textbox', { name: /descripción \*/i })).toHaveValue(description)

    // Go forward to Step 3 and verify price is retained
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByLabel(/precio \(bob\)/i)).toHaveValue('1000')
    await expect(page.getByLabel(/ciudad/i)).toHaveValue('Santa Cruz')
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility
// ---------------------------------------------------------------------------
test.describe('Create Product - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Step 1 (Photos) passes axe-core audit', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Step 2 (Info) passes axe-core audit', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    await uploadPhotoAndProceed(page)

    await runAxeAudit(page)
  })

  test('Step 3 (Details) passes axe-core audit', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Navigate to Step 3
    await uploadPhotoAndProceed(page)
    await page.getByLabel(/título del producto/i).fill('Test Product for A11y')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })

  test('Step 4 (Review) passes axe-core audit', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    // Step 1: Photos
    await uploadPhotoAndProceed(page)

    // Step 2: Info
    await page.getByLabel(/título del producto/i).fill('Test Product for A11y')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await selectElectronicsCategory(page)
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    // Step 3: Details
    await page.getByLabel(/precio \(bob\)/i).fill('1000')
    await page.locator('#condition-new').click()
    await page.locator('#location_department').click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.locator('#location_city').fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page)
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Create Product - Mobile Responsive (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Wizard fits viewport with no horizontal scroll', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Touch targets are at least 44px', async ({ page }) => {
    await page.goto('/publicar')
    await page.waitForLoadState('networkidle')

    const buttons = page.locator('button, a[href], input:not([type="hidden"]), [role="button"]')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 15); i++) {
      const box = await buttons.nth(i).boundingBox()
      // Skip hidden/zero-size elements (e.g. file inputs styled off-screen)
      if (box && box.width > 4 && box.height > 4) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
