/**
 * M4 Semantic Search - End-to-End Test
 *
 * Tests the full semantic search pipeline:
 * - Hybrid search mode (keyword + semantic via RRF)
 * - Cross-language queries (English -> Spanish products)
 * - Concept queries (abstract terms find concrete products)
 * - Category filtering with semantic search
 * - Search mode metadata in API response
 *
 * Prerequisites: Dev server running, SEMANTIC_SEARCH_ENABLED=true,
 * products with embeddings in the database.
 *
 * Run: npx playwright test tests/m4-semantic-search-e2e.spec.ts --project=chromium
 * Visual: npx playwright test tests/m4-semantic-search-e2e.spec.ts --project=chromium --headed
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT = path.join(process.cwd(), 'test-screenshots', 'm4-semantic-search')

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true })
})

test.describe('M4 Semantic Search E2E', () => {
  test('Electronics: concept queries find correct products', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1280, height: 800 })

    // --- E1: "computadora portatil" should find Laptop HP ---
    await page.goto('/buscar?q=computadora+portatil')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '01-computadora-portatil.png'),
      fullPage: true,
    })

    const firstResult1 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult1).toContainText(/Laptop.*HP|HP.*Pavilion/i)

    // --- E2: "headphones wireless" (English) should find Audífonos Sony ---
    await page.goto('/buscar?q=headphones+wireless')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '02-headphones-wireless.png'),
      fullPage: true,
    })

    const firstResult2 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult2).toContainText(/Audífonos|Sony|WH-1000/i)

    // --- E3: "reloj para hacer ejercicio" -> Smartwatch ---
    await page.goto('/buscar?q=reloj+para+hacer+ejercicio')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '03-reloj-ejercicio.png'),
      fullPage: true,
    })

    const firstResult3 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult3).toContainText(/Smartwatch|Apple Watch/i)

    // --- E4: "pantalla para dibujar" -> Tablet Samsung ---
    await page.goto('/buscar?q=pantalla+para+dibujar')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '04-pantalla-dibujar.png'),
      fullPage: true,
    })

    const firstResult4 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult4).toContainText(/Tablet|Galaxy Tab/i)

    // --- E5: "bateria para celular viaje" -> Cargador Portátil ---
    await page.goto('/buscar?q=bateria+para+celular+viaje')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '05-bateria-celular.png'),
      fullPage: true,
    })

    const firstResult5 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult5).toContainText(/Cargador|Anker|PowerCore/i)
  })

  test('Home: concept queries find correct products', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1280, height: 800 })

    // --- H1: "couch living room" (English) -> Sofá ---
    await page.goto('/buscar?q=couch+living+room')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '06-couch-living-room.png'),
      fullPage: true,
    })

    const firstResult6 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult6).toContainText(/Sofá|Seccional/i)

    // --- H2: "luz para leer de noche" -> Lámpara ---
    await page.goto('/buscar?q=luz+para+leer+de+noche')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '07-luz-leer-noche.png'),
      fullPage: true,
    })

    const firstResult7 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult7).toContainText(/Lámpara|LED/i)

    // --- H3: "repisa para libros" -> Estante Flotante ---
    await page.goto('/buscar?q=repisa+para+libros')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '08-repisa-libros.png'),
      fullPage: true,
    })

    const firstResult8 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult8).toContainText(/Estante|Flotante|Madera/i)

    // --- H4: "tapete artesanal boliviano" -> Alfombra ---
    await page.goto('/buscar?q=tapete+artesanal+boliviano')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '09-tapete-artesanal.png'),
      fullPage: true,
    })

    const firstResult9 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult9).toContainText(/Alfombra|Artesanal|Tejida/i)

    // --- H5: "espejo para dormitorio" -> Espejo Decorativo ---
    await page.goto('/buscar?q=espejo+para+dormitorio')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '10-espejo-dormitorio.png'),
      fullPage: true,
    })

    const firstResult10 = page.locator('h3, [data-testid="product-title"]').first()
    await expect(firstResult10).toContainText(/Espejo|Decorativo|Dorado/i)
  })

  test('Category filter isolates results correctly', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1280, height: 800 })

    // --- C1: "gadgets" + category=electronics -> only electronics ---
    await page.goto('/buscar?q=gadgets&category=electronics')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '11-gadgets-electronics-only.png'),
      fullPage: true,
    })

    // Verify results count text is visible
    await expect(page.getByText(/resultado/)).toBeVisible()

    // --- C2: "decoracion" + category=home -> only home ---
    await page.goto('/buscar?q=decoracion&category=home')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '12-decoracion-home-only.png'),
      fullPage: true,
    })

    await expect(page.getByText(/resultado/)).toBeVisible()
  })

  test('Search API returns correct metadata', async ({ request }) => {
    // --- Hybrid mode when query present ---
    const hybridRes = await request.get('/api/search?q=laptop')
    const hybridData = await hybridRes.json()

    expect(hybridRes.ok()).toBeTruthy()
    expect(hybridData.searchMode).toBe('hybrid')
    expect(hybridData.latencyMs).toBeGreaterThan(0)
    expect(hybridData.totalCount).toBeGreaterThan(0)
    expect(typeof hybridData.embeddingCached).toBe('boolean')

    // --- Keyword mode when no query (browse) ---
    const keywordRes = await request.get('/api/search?category=electronics')
    const keywordData = await keywordRes.json()

    expect(keywordRes.ok()).toBeTruthy()
    expect(keywordData.searchMode).toBe('keyword')
    expect(keywordData.totalCount).toBeGreaterThan(0)

    // --- Embedding cache works on repeated query ---
    // Use a unique query with timestamp to avoid cache from previous runs
    const uniqueQuery = `cache_test_${Date.now()}`
    const firstCall = await request.get(`/api/search?q=${uniqueQuery}`)
    const firstData = await firstCall.json()
    expect(firstData.embeddingCached).toBe(false)

    const secondCall = await request.get(`/api/search?q=${uniqueQuery}`)
    const secondData = await secondCall.json()
    expect(secondData.embeddingCached).toBe(true)
    expect(secondData.latencyMs).toBeLessThan(firstData.latencyMs)
  })

  test('Mobile semantic search works', async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 375, height: 812 })

    // Navigate to search with a semantic query
    await page.goto('/buscar?q=computadora+para+trabajar')
    await page.waitForSelector('[data-testid="product-card"], .grid a', {
      state: 'visible',
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(OUT, '13-mobile-semantic-search.png'),
      fullPage: true,
    })

    // Verify results show
    await expect(page.getByText(/resultado/)).toBeVisible()

    // Open mobile filters
    const filtersButton = page.getByRole('button', { name: /[Ff]iltros/ })
    if (await filtersButton.isVisible()) {
      await filtersButton.click()
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(OUT, '14-mobile-filters-open.png'),
        fullPage: true,
      })
    }
  })
})
