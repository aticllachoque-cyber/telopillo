import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const TEST_USER_EMAIL = 'dev@telopillo.test'
const TEST_USER_PASSWORD = 'DevTest123'

// ---------------------------------------------------------------------------
// Helper: Login
// ---------------------------------------------------------------------------
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/contraseña/i).fill(TEST_USER_PASSWORD)
  await page.locator('#main-content button[type="submit"]').click()
  await page.waitForURL('**/*', { timeout: 15000 })
}

// Create a minimal valid PNG (1x1 pixel)
function createValidPngBuffer(): Buffer {
  // PNG signature + IHDR + IDAT + IEND (minimal valid 1x1 PNG)
  const png = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41,
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xff,
    0xff,
    0x3f,
    0x00,
    0x05,
    0xfe,
    0x02,
    0xfe,
    0xdc,
    0xcc,
    0x59,
    0xe7,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ])
  return png
}

// Create a buffer that simulates a non-image file (PDF-like header)
function createPdfLikeBuffer(): Buffer {
  return Buffer.from('%PDF-1.4 fake pdf content for test', 'utf-8')
}

// ---------------------------------------------------------------------------
// 1. Avatar Section Visibility
// ---------------------------------------------------------------------------
test.describe('Account Management - Avatar Upload', () => {
  test('Avatar section is visible on profile edit page', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/foto de perfil/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /cambiar foto/i })).toBeVisible()
  })

  test('Upload valid image and verify avatar displays', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    const fileInput = page.getByLabel(/seleccionar imagen de avatar/i)
    await expect(fileInput).toBeAttached()

    const pngBuffer = createValidPngBuffer()
    await fileInput.setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    // Wait for upload to complete (button changes from "Subiendo..." back to "Cambiar Foto")
    await expect(page.getByRole('button', { name: /cambiar foto/i })).toBeVisible({
      timeout: 10000,
    })

    // Avatar should show the image (img with src, or we at least have no error)
    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /selecciona una imagen|menor a 5mb/i })
    await expect(errorAlert).not.toBeVisible()

    // Verify avatar area has image (img element with src containing blob or avatars)
    const avatarImg = page.locator('img[alt="Avatar preview"]')
    await expect(avatarImg).toBeVisible({ timeout: 5000 })
  })

  test('Non-image file shows error', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    const fileInput = page.getByLabel(/seleccionar imagen de avatar/i)
    await expect(fileInput).toBeAttached()

    const pdfBuffer = createPdfLikeBuffer()
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    })

    await expect(page.getByRole('alert').filter({ hasText: /selecciona una imagen/i })).toBeVisible(
      { timeout: 5000 }
    )
  })

  test('Oversized file shows error', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')

    const fileInput = page.getByLabel(/seleccionar imagen de avatar/i)
    await expect(fileInput).toBeAttached()

    // Create buffer > 5MB (AvatarUpload validates 5 * 1024 * 1024)
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024)
    createValidPngBuffer().copy(oversizedBuffer)

    await fileInput.setInputFiles({
      name: 'large.png',
      mimeType: 'image/png',
      buffer: oversizedBuffer,
    })

    await expect(
      page.getByRole('alert').filter({ hasText: /la imagen debe ser menor a 5mb/i })
    ).toBeVisible({ timeout: 5000 })
  })
})
