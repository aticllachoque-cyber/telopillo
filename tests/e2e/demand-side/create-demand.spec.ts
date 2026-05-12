/**
 * Demand Side — Create Demand Post
 *
 * Covers the current 4-step DemandPostForm wizard:
 * - Auth guard for /busco/publicar
 * - Step 1 validation on empty advance
 * - Keyboard/category interaction regression
 * - Successful creation and redirect to demand detail
 *
 * Run: npx playwright test tests/e2e/demand-side/create-demand.spec.ts
 */
import { test, expect } from '@playwright/test'
import { authenticatedTest } from '../../fixtures'

test.describe('Create Demand Post', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/busco/publicar')
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain('/login')
    const redirect = new URL(page.url()).searchParams.get('redirect')
    expect(redirect).toBe('/busco/publicar')
  })

  authenticatedTest('Wizard renders correctly for authenticated user', async ({ page }) => {
    await page.goto('/busco/publicar')

    await expect(page.getByRole('heading', { name: /publicá lo que buscás/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /referencia de la solicitud/i })).toBeVisible()
    await expect(page.getByLabel(/qué estás buscando/i)).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: /categoría del producto/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^siguiente$/i })).toBeVisible()
  })

  authenticatedTest('Step 1 shows validation errors on empty advance', async ({ page }) => {
    await page.goto('/busco/publicar')
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await expect(page.getByText(/el título debe tener al menos 5 caracteres/i)).toBeVisible()
    await expect(page.getByText(/selecciona una categoría/i)).toBeVisible()
    await expect(page).toHaveURL(/\/busco\/publicar$/)
    await expect(page.getByRole('heading', { name: /referencia de la solicitud/i })).toBeVisible()
  })

  authenticatedTest(
    'Category grid supports keyboard selection and advances to step 2',
    async ({ page }) => {
      await page.goto('/busco/publicar')

      await page.getByLabel(/qué estás buscando/i).fill('Busco iPhone 13 128GB')

      const firstCategory = page.getByTestId('category-electronics')
      await firstCategory.click()
      await page.keyboard.press('ArrowRight')

      await page.getByRole('button', { name: /^siguiente$/i }).click()

      await expect(page.getByRole('heading', { name: /describe lo que necesitas/i })).toBeVisible()
      await expect(page.getByLabel(/describe lo que necesitas/i)).toBeVisible()
    }
  )

  authenticatedTest('User can create a demand post successfully', async ({ page }) => {
    const uniqueSuffix = Date.now()
    const title = `Busco iPhone 13 ${uniqueSuffix}`
    const description =
      'Necesito un iPhone 13 en buen estado, preferiblemente 128GB o más, sin pantalla rota y con batería sana.'

    await page.goto('/busco/publicar')

    await page.getByLabel(/qué estás buscando/i).fill(title)
    await page.getByTestId('category-electronics').click()
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await expect(page.getByRole('heading', { name: /describe lo que necesitas/i })).toBeVisible()
    await page.getByLabel(/describe lo que necesitas/i).fill(description)
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await expect(page.getByRole('heading', { name: /ubicación y presupuesto/i })).toBeVisible()
    await page.getByRole('spinbutton', { name: /desde bs\./i }).fill('2500')
    await page.getByRole('spinbutton', { name: /hasta bs\./i }).fill('3500')
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await expect(page.getByRole('heading', { name: /revisa tu solicitud/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /publicar solicitud/i })).toBeVisible()

    await page.getByRole('button', { name: /publicar solicitud/i }).click()

    await expect(page).toHaveURL(/\/busco\/.+/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText(description)).toBeVisible()
    await expect(page.getByText(/presupuesto · bs 2\.500 - bs 3\.500/i)).toBeVisible()
  })
})
