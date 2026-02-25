/**
 * Creates 5 sample demand posts for populating /busco.
 * Run: npx playwright test tests/e2e/demand-side/create-sample-demands.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const EMAIL = 'dev@telopillo.test'
const PASSWORD = 'DevTest123'

const DEMANDS = [
  {
    title: 'Busco iPhone 14 o 15 en buen estado',
    description:
      'Estoy buscando un iPhone 14 o 15 en buen estado, preferiblemente con caja y accesorios originales. Color negro o blanco. Que tenga batería en buenas condiciones.',
    category: 'Electrónica',
    department: 'La Paz',
    city: 'La Paz',
    priceMin: 1500,
    priceMax: 4000,
  },
  {
    title: 'Necesito muebles de oficina usados',
    description:
      'Busco escritorio, silla ergonómica y estante para armar mi oficina en casa. Pueden ser usados pero en buen estado. Tengo pickup para recoger en Cochabamba.',
    category: 'Hogar y Jardín',
    department: 'Cochabamba',
    city: 'Cochabamba',
    priceMin: 200,
    priceMax: 1500,
  },
  {
    title: 'Busco bicicleta mountain bike aro 29',
    description:
      'Necesito una bicicleta mountain bike aro 29 para uso recreativo en senderos. Preferiblemente con frenos de disco hidráulicos y suspensión delantera. Marcas como Trek, Giant o Specialized.',
    category: 'Deportes',
    department: 'Santa Cruz',
    city: 'Santa Cruz de la Sierra',
    priceMin: 800,
    priceMax: 3000,
  },
  {
    title: 'Busco juegos de mesa para familia',
    description:
      'Estoy buscando juegos de mesa para noches familiares. Monopoly, Catán, Uno, Jenga o similares. Pueden ser nuevos o usados en buen estado. También me interesan puzzles de 1000 piezas.',
    category: 'Juguetes y Juegos',
    department: 'La Paz',
    city: 'El Alto',
    priceMin: 50,
    priceMax: 300,
  },
  {
    title: 'Necesito ropa de bebé talla 0-6 meses',
    description:
      'Mi bebé va a nacer pronto y necesito ropa de recién nacido talla 0 a 6 meses. Bodies, pijamas, gorros, medias. Prefiero algodón. Puede ser usado en buen estado o nuevo.',
    category: 'Para Bebés y Niños',
    department: 'Oruro',
    city: 'Oruro',
    priceMin: 30,
    priceMax: 200,
  },
]

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/contraseña/i).fill(PASSWORD)
  await page.locator('#main-content button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
}

async function fillDemandForm(page: import('@playwright/test').Page, d: (typeof DEMANDS)[0]) {
  await page.getByLabel(/qué estás buscando/i).fill(d.title)
  await page.getByLabel(/describe lo que necesitas/i).fill(d.description)

  await page.getByLabel(/categoría/i).click()
  await page.getByRole('option', { name: d.category }).click()

  await page.getByLabel(/departamento/i).click()
  await page.getByRole('option', { name: new RegExp(`^${d.department}$`) }).click()

  await page.getByLabel(/ciudad/i).click()
  await page.getByRole('option', { name: d.city }).click()

  await page.getByLabel(/desde bs\./i).fill(String(d.priceMin))
  await page.getByLabel(/hasta bs\./i).fill(String(d.priceMax))
}

test.describe('Create Sample Demands', () => {
  test('Login and create 5 demand posts', async ({ page }) => {
    test.setTimeout(240000) // 4 min for 5 posts + verify
    const results: { title: string; success: boolean; error?: string }[] = []

    await login(page)

    for (let i = 0; i < DEMANDS.length; i++) {
      const d = DEMANDS[i]
      try {
        await page.goto(`${BASE_URL}/busco/publicar`)
        await page.waitForLoadState('networkidle')

        if (page.url().includes('/login')) {
          results.push({ title: d.title, success: false, error: 'Redirected to login' })
          await login(page)
          await page.goto(`${BASE_URL}/busco/publicar`)
          await page.waitForLoadState('networkidle')
        }

        await fillDemandForm(page, d)

        await page.getByRole('button', { name: /publicar solicitud/i }).click()

        await expect(page).toHaveURL(/\/busco\/[a-f0-9-]+/, { timeout: 10000 })
        results.push({ title: d.title, success: true })
      } catch (err) {
        results.push({
          title: d.title,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    await page.goto(`${BASE_URL}/busco`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('a[href^="/busco/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    await page.screenshot({ path: 'test-results/demands-listing.png' })

    console.log('Results:', JSON.stringify(results, null, 2))
  })
})
