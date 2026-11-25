/**
 * Vitrina (seller-curated catalog) — end-to-end.
 *
 * Seller side (/perfil/mis-productos, business mode → CatalogManager):
 *   feature up to 4 products (cap enforced), manual reorder persists,
 *   promotions can still be managed from the catalog manager.
 * Buyer side (/negocio/[slug]):
 *   "Destacados" section, featured items carry their promotion and are not
 *   duplicated in the grid, section chips, sort, pagination, a11y, mobile layout.
 *
 * Data is resolved at runtime from the business slug (no hard-coded product IDs)
 * and the seller's original featured/order state is restored in afterAll.
 * Mutations run once on the chromium project only (shared DB state).
 */
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { assertNoHorizontalScroll, login, runAxeAudit } from '../../helpers'
import { encodeUuidToPublicToken } from '../../../lib/utils/publicRoutes'

/** Product links use the public base62 token, not the raw UUID. */
const linkTo = (id: string) => `a[href*="/productos/${encodeUuidToPublicToken(id)}"]`

const SELLER_EMAIL = process.env.VITRINA_SELLER_EMAIL || 'josefeliciano0.3@test.com'
const SELLER_PASSWORD = process.env.VITRINA_SELLER_PASSWORD || 'TestPassword123'
const BIZ_SLUG = process.env.VITRINA_BIZ_SLUG || 'jose-felicianoalmodin'
const MAX_FEATURED = 4
const PROMO_NAME = 'Vitrina E2E Promo'

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq !== -1) env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
    }
  }
  // Process env wins (CI / shells that export the local Supabase keys)
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (process.env[key]) env[key] = process.env[key] as string
  }
  return env
}

interface ProductRow {
  id: string
  title: string
  price: number
  category: string
  is_featured: boolean
  display_order: number | null
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const serviceHeaders: Record<string, string> = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function rest<T>(
  request: APIRequestContext,
  method: 'get' | 'patch' | 'delete',
  pathAndQuery: string,
  data?: unknown
): Promise<T> {
  const res = await request[method](`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: serviceHeaders,
    data,
  })
  expect(res.ok(), `${method.toUpperCase()} ${pathAndQuery} → ${res.status()}`).toBeTruthy()
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

async function fetchSellerProducts(request: APIRequestContext, sellerId: string) {
  return rest<ProductRow[]>(
    request,
    'get',
    `products?select=id,title,price,category,is_featured,display_order&user_id=eq.${sellerId}&status=eq.active&order=created_at.desc`
  )
}

function catalogCard(page: Page, product: Pick<ProductRow, 'id'>) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator(linkTo(product.id)) })
    .last()
}

async function openCatalogManager(page: Page) {
  await page.goto('/perfil/mis-productos')
  await expect(page.getByRole('heading', { name: /catálogo de mi negocio/i })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByText(/Destacados:/)).toBeVisible()
}

test.describe('Vitrina — seller-curated catalog (E2E)', () => {
  test.describe.configure({ mode: 'serial' })

  let sellerId = ''
  let products: ProductRow[] = []
  let original: Pick<ProductRow, 'id' | 'is_featured' | 'display_order'>[] = []
  let featured: ProductRow[] = []
  let fifth: ProductRow

  test.beforeAll(async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Mutates shared DB state; runs once')
    expect(SUPABASE_URL && SERVICE_KEY, 'Local Supabase URL + service key required').toBeTruthy()

    const biz = await rest<{ id: string }[]>(
      request,
      'get',
      `business_profiles?select=id&slug=eq.${BIZ_SLUG}`
    )
    expect(biz.length, `business profile ${BIZ_SLUG} must exist`).toBe(1)
    sellerId = biz[0]!.id

    products = await fetchSellerProducts(request, sellerId)
    expect(products.length, 'need > 12 active products to exercise pagination').toBeGreaterThan(12)
    original = products.map(({ id, is_featured, display_order }) => ({
      id,
      is_featured,
      display_order,
    }))

    // Clean slate: nothing featured, no manual order, no leftover E2E promotion
    await rest(request, 'patch', `products?user_id=eq.${sellerId}`, {
      is_featured: false,
      display_order: null,
    })
    await rest(request, 'delete', `promotions?name=eq.${encodeURIComponent(PROMO_NAME)}`)
    products = await fetchSellerProducts(request, sellerId)
    // One product per distinct title keeps buyer-side headings unambiguous
    // (seed data may repeat titles); everything else is matched by product id.
    const seen = new Set<string>()
    const distinct = products.filter((p) => !seen.has(p.title) && seen.add(p.title))
    expect(distinct.length, 'need 5 distinct products').toBeGreaterThan(MAX_FEATURED)
    featured = distinct.slice(0, MAX_FEATURED)
    fifth = distinct[MAX_FEATURED]!
  })

  test.afterAll(async ({ request }, testInfo) => {
    if (testInfo.project.name !== 'chromium' || !sellerId) return
    await rest(request, 'delete', `promotions?name=eq.${encodeURIComponent(PROMO_NAME)}`)
    for (const row of original) {
      await rest(request, 'patch', `products?id=eq.${row.id}`, {
        is_featured: row.is_featured,
        display_order: row.display_order,
      })
    }
  })

  test('V1: seller features up to 4 products; the 5th is blocked', async ({ page, request }) => {
    test.setTimeout(120_000)
    await login(page, SELLER_EMAIL, SELLER_PASSWORD)
    await openCatalogManager(page)
    await expect(page.getByText(/Destacados:\s*0 de 4/)).toBeVisible()

    for (const [i, product] of featured.entries()) {
      const toggle = catalogCard(page, product).getByRole('button', { name: /^destacar$/i })
      await toggle.click()
      await expect(
        catalogCard(page, product).getByRole('button', { name: /^destacado$/i })
      ).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByText(new RegExp(`Destacados:\\s*${i + 1} de 4`))).toBeVisible()
    }

    await expect(page.getByText(/máximo alcanzado/i)).toBeVisible()
    await expect(
      catalogCard(page, fifth).getByRole('button', { name: /^destacar$/i })
    ).toBeDisabled()

    const rows = await fetchSellerProducts(request, sellerId)
    expect(
      rows
        .filter((r) => r.is_featured)
        .map((r) => r.id)
        .sort()
    ).toEqual(featured.map((f) => f.id).sort())
  })

  test('V2: manual reorder within a category persists after reload', async ({ page, request }) => {
    test.setTimeout(90_000)
    const byCategory = new Map<string, ProductRow[]>()
    for (const p of products) byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p])
    const [category] = [...byCategory.entries()].find(([, items]) => items.length >= 2)!

    await login(page, SELLER_EMAIL, SELLER_PASSWORD)
    await openCatalogManager(page)

    const section = page.locator(`section[aria-labelledby="catalog-${category}"]`)
    // Product order inside the section, as ids parsed from the card links
    const idsInSection = async () =>
      (
        await section
          .locator('a[href*="/productos/"]')
          .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).pathname))
      ).map(
        (pathname) =>
          products.find((p) => pathname.includes(encodeUuidToPublicToken(p.id)))?.id ?? pathname
      )

    const before = await idsInSection()
    expect(before.length).toBeGreaterThanOrEqual(2)
    const [firstId, secondId] = [before[0]!, before[1]!]
    const expected = [secondId, firstId, ...before.slice(2)]
    await catalogCard(page, { id: firstId })
      .getByRole('button', { name: /^bajar .* en la lista$/i })
      .click()
    await expect.poll(idsInSection).toEqual(expected)

    await page.reload()
    await expect(page.getByText(/Destacados:/)).toBeVisible({ timeout: 20_000 })
    await expect.poll(idsInSection).toEqual(expected)

    const rows = await fetchSellerProducts(request, sellerId)
    const order = (id: string) => rows.find((r) => r.id === id)?.display_order ?? null
    expect(order(secondId)).not.toBeNull()
    expect(order(secondId)!).toBeLessThan(order(firstId)!)
  })

  test('V3: promotions stay manageable from the catalog manager', async ({ page }) => {
    test.setTimeout(90_000)
    const target = featured[0]!
    await login(page, SELLER_EMAIL, SELLER_PASSWORD)
    await openCatalogManager(page)

    await catalogCard(page, target)
      .getByRole('button', { name: `Acciones para ${target.title}` })
      .click()
    await page.getByRole('menuitem', { name: 'Agregar promoción' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox', { name: /nombre de la promoción/i }).fill(PROMO_NAME)
    await dialog.getByRole('button', { name: 'Aplicar 10% de descuento' }).click()
    await dialog.getByRole('button', { name: 'Guardar promoción' }).click()
    await expect(page.getByText('Promoción agregada al producto')).toBeVisible()

    // The manager itself now shows the sale price (shared ProductPrice component)
    await page.reload()
    await expect(
      catalogCard(page, target).getByText('Precio en promoción:', { exact: false })
    ).toBeAttached({ timeout: 20_000 })
  })

  test('V4: buyer storefront shows featured first, with its promotion, not duplicated', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.goto(`/negocio/${BIZ_SLUG}`)
    const featuredSection = page.locator('section[aria-labelledby="featured-heading"]')
    await expect(featuredSection.getByRole('heading', { name: 'Destacados' })).toBeVisible()

    for (const product of featured) {
      await expect(featuredSection.locator(linkTo(product.id)).first()).toBeVisible()
      // Featured items are filtered out of the main grid → only one card links to each
      await expect(
        page.locator('ul.grid > li').filter({ has: page.locator(linkTo(product.id)) })
      ).toHaveCount(1)
    }

    // Regression: featured products must carry their active promotion
    const promoted = featuredSection
      .locator('[data-slot="card"]')
      .filter({ has: page.locator(linkTo(featured[0]!.id)) })
    await expect(promoted.getByText(PROMO_NAME)).toBeVisible()
    await expect(promoted.getByText('Precio en promoción:', { exact: false })).toBeAttached()

    await expect(
      page.getByRole('combobox').filter({ hasText: /orden de la tienda/i })
    ).toBeVisible()
    await runAxeAudit(page)
  })

  test('V5: section chips filter the catalog and hide the featured strip', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(`/negocio/${BIZ_SLUG}`)
    const chips = page.getByRole('navigation', { name: 'Categorías del catálogo' })
    await expect(chips.getByRole('link', { name: 'Todo' })).toHaveAttribute('aria-current', 'page')

    const chip = chips.getByRole('link').nth(1)
    const expected = Number((await chip.locator('span').last().textContent())?.trim())
    await chip.click()
    await expect(page).toHaveURL(/[?&]cat=/)
    await expect(chip).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('section[aria-labelledby="featured-heading"]')).toHaveCount(0)
    await expect(page.locator('ul.grid > li')).toHaveCount(expected)
  })

  test('V6: pagination reaches page 2 and back', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(`/negocio/${BIZ_SLUG}`)
    const pager = page.getByRole('navigation', { name: 'Paginación de productos' })
    await pager.getByRole('link', { name: /siguiente/i }).click()
    await expect(page).toHaveURL(/page=2/)
    // Featured strip only lives on page 1
    await expect(page.locator('section[aria-labelledby="featured-heading"]')).toHaveCount(0)
    await page
      .getByRole('navigation', { name: 'Paginación de productos' })
      .getByRole('link', { name: /anterior/i })
      .click()
    await expect(page.locator('section[aria-labelledby="featured-heading"]')).toBeVisible()
  })

  test('V7: mobile storefront — featured carousel without page overflow', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`/negocio/${BIZ_SLUG}`)
    await expect(page.locator('section[aria-labelledby="featured-heading"]')).toBeVisible()
    await assertNoHorizontalScroll(page)
    await runAxeAudit(page)
  })

  test('V8: catalog manager passes axe audit', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page, SELLER_EMAIL, SELLER_PASSWORD)
    await openCatalogManager(page)
    await runAxeAudit(page)
  })
})
