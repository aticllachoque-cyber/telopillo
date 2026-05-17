import { authenticatedTest, expect } from '../../fixtures'

authenticatedTest.describe('Network Resilience', () => {
  authenticatedTest(
    'Homepage preview falls back to cached content when API fails',
    async ({ page }) => {
      await page.goto('/', { waitUntil: 'load' })

      await page.waitForResponse((response) => response.url().includes('/api/home-preview'))

      await page.route('**/api/home-preview', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'forced failure' }),
        })
      })

      await page.goto('/categorias', { waitUntil: 'load' })
      await page.goto('/', { waitUntil: 'load' })

      await expect(
        page.getByText(/mostrando contenido guardado por una falla de conexión/i)
      ).toBeVisible({ timeout: 15000 })
    }
  )

  authenticatedTest('Demand draft can be restored after reload', async ({ page }) => {
    await page.goto('/busco/publicar', { waitUntil: 'load' })

    await page.getByLabel(/qué estás buscando/i).fill('Busco iPhone 13 128GB para prueba draft')
    await page.getByTestId('category-electronics').click()

    await expect(page.getByText(/borrador guardado localmente/i)).toBeVisible({ timeout: 5000 })

    await page.reload({ waitUntil: 'load' })

    await expect(page.getByText(/encontramos un borrador guardado/i)).toBeVisible({
      timeout: 10000,
    })
    await page.getByRole('button', { name: /restaurar borrador/i }).click()

    await expect(page.getByLabel(/qué estás buscando/i)).toHaveValue(
      'Busco iPhone 13 128GB para prueba draft'
    )
    await expect(page.getByTestId('category-electronics')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText(/estás trabajando sobre un borrador recuperado/i)).toBeVisible()
  })

  authenticatedTest(
    'Product search falls back to cached results when API fails',
    async ({ page }) => {
      await page.goto('/buscar?q=samsung', { waitUntil: 'load' })

      await expect(page.getByRole('status')).toContainText(
        /resultado|no se encontraron resultados/i,
        {
          timeout: 15000,
        }
      )

      await page.route('**/api/search?**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'forced failure' }),
        })
      })

      await page.goto('/categorias', { waitUntil: 'load' })
      await page.goto('/buscar?q=samsung', { waitUntil: 'load' })

      await expect(
        page.getByText(/mostrando resultados guardados por una falla de conexión/i)
      ).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  )

  authenticatedTest(
    'Demand search falls back to cached results when API fails',
    async ({ page }) => {
      await page.goto('/busco?q=iphone', { waitUntil: 'load' })

      await expect(page.getByRole('status')).toContainText(/solicitud|solicitudes/i, {
        timeout: 15000,
      })

      await page.route('**/api/search-demands?**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'forced failure' }),
        })
      })

      await page.goto('/categorias', { waitUntil: 'load' })
      await page.goto('/busco?q=iphone', { waitUntil: 'load' })

      await expect(
        page.getByText(/mostrando solicitudes guardadas por una falla de conexión/i)
      ).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
  )
})
