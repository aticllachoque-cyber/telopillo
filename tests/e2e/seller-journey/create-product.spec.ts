import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// Minimal 1x1 PNG for image upload tests
const MINIMAL_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
  await page.locator('#main-content button[type="submit"]').click()
  await page.waitForURL('**/*', { timeout: 15000 })
}

// ---------------------------------------------------------------------------
// 1. Create Product - Wizard Flow
// ---------------------------------------------------------------------------
test.describe('Create Product - Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Wizard Step 1 is visible after navigating to /publicar', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /publicar producto/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /información básica/i })).toBeVisible()
    await expect(page.getByLabel(/título del producto/i)).toBeVisible()
    await expect(page.getByRole('textbox', { name: /descripción \*/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /categoría \*/i })).toBeVisible()
  })

  test('Completes full wizard and publishes product', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    // Step 1: Basic Info
    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB - Test E2E')
    await page
      .getByRole('textbox', { name: /descripción \*/i })
      .fill(
        'iPhone 13 Pro Max en excelente estado. Incluye cargador y funda. Sin rayones en pantalla. Batería al 95%.'
      )
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 2: Details
    await expect(page.getByRole('heading', { name: /detalles del producto/i })).toBeVisible({
      timeout: 3000,
    })
    await page.getByLabel(/precio \(bob\)/i).fill('5000')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /como nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.getByLabel(/ciudad/i).fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 3: Photos
    await expect(page.getByRole('heading', { name: /fotos del producto/i })).toBeVisible({
      timeout: 3000,
    })
    const fileInput = page.locator('input[type="file"][accept*="image"]')
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG_BUFFER,
    })
    await expect(page.getByText(/subiendo/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/subiendo/i)).not.toBeVisible({ timeout: 30000 })
    await page.getByRole('button', { name: /siguiente/i }).click()

    // Step 4: Review
    await expect(page.getByRole('heading', { name: /revisar y publicar/i })).toBeVisible({
      timeout: 3000,
    })
    await expect(page.getByText(/iPhone 13 Pro Max 256GB - Test E2E/i)).toBeVisible()
    await expect(page.getByText(/Bs\s*5[\d.,\s]*000/)).toBeVisible()
    await page.getByRole('button', { name: /publicar producto/i }).click()

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 15000 })
    expect(page.url()).toContain('/productos/')
    await expect(page.getByText(/iPhone 13 Pro Max 256GB - Test E2E/i)).toBeVisible()
    await expect(page.getByText(/Bs\s*5[\d.,\s]*000/)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Validation Errors
// ---------------------------------------------------------------------------
test.describe('Create Product - Validation Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Step 1 shows error when title is empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/título debe tener al menos 10 caracteres/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('Step 1 shows error when category is not selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/selecciona una categoría/i)).toBeVisible({ timeout: 3000 })
  })

  test('Step 2 shows error for negative price', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    // Complete Step 1
    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('-100')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /como nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.getByLabel(/ciudad/i).fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/precio debe ser mayor a 0/i)).toBeVisible({ timeout: 3000 })
  })

  test('Step 2 shows error for zero price', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill('iPhone 13 Pro Max 256GB')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('0')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /como nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.getByLabel(/ciudad/i).fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()

    await expect(page.getByText(/precio debe ser mayor a 0/i)).toBeVisible({ timeout: 3000 })
  })

  test('Data is preserved when navigating back and forth between steps', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    const title = 'Test Product Title for Data Preservation'
    const description = 'A'.repeat(50)

    await page.getByLabel(/título del producto/i).fill(title)
    await page.getByRole('textbox', { name: /descripción \*/i }).fill(description)
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')
    await page.getByLabel(/precio \(bob\)/i).fill('1000')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /santa cruz/i }).click()
    await page.getByLabel(/ciudad/i).fill('Santa Cruz')
    await page.getByRole('button', { name: /anterior/i }).click()

    await expect(page.getByLabel(/título del producto/i)).toHaveValue(title)
    await expect(page.getByRole('textbox', { name: /descripción \*/i })).toContainText(description)
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

  test('Step 1 passes axe-core audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
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

  test('Step 2 passes axe-core audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill('Test Product for A11y')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()

    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Step 3 passes axe-core audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill('Test Product for A11y')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/precio \(bob\)/i).fill('1000')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /nuevo/i })
      .click()
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /la paz/i }).click()
    await page.getByLabel(/ciudad/i).fill('La Paz')
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
  })

  test('Step 4 passes axe-core audit', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título del producto/i).fill('Test Product for A11y')
    await page.getByRole('textbox', { name: /descripción \*/i }).fill('A'.repeat(50))
    await page.getByRole('combobox', { name: /categoría \*/i }).click()
    await page.getByRole('option', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /siguiente/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/precio \(bob\)/i).fill('1000')
    await page
      .getByLabel(/estado del producto/i)
      .locator('..')
      .getByRole('radio', { name: /nuevo/i })
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

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')
    expect(critical.length).toBe(0)
    expect(serious.length).toBe(0)
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
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })

  test('Touch targets are at least 44px', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    const buttons = page.locator('button, a[href], input:not([type="hidden"]), [role="button"]')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 15); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box && box.width > 0 && box.height > 0) {
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('Next button is visible and full-width on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')

    const nextBtn = page.getByRole('button', { name: /siguiente/i })
    await expect(nextBtn).toBeVisible()
    const box = await nextBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
  })
})
