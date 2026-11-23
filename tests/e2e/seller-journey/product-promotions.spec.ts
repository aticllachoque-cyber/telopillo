import { test, expect, type Page } from '@playwright/test'
import {
  assertNoHorizontalScroll,
  gotoMyProductsPage,
  gotoReady,
  login,
  runAxeAudit,
} from '../../helpers'

const DEV_USER_ID = 'dc7a90d3-046c-43c3-8e1d-60a4052fd5f1'

const PRODUCT_PAIRS = {
  chromium: {
    first: {
      id: '0c1c3c98-d602-4056-a26a-43b04746bfbd',
      title: 'Mesa plegable multiuso 120 cm para oficina o estudio',
      price: 680,
      promoPrice: 550, // -19%
      searchQuery: 'Mesa plegable',
    },
    second: {
      id: 'b3bed804-7a25-40af-bc27-28e3746930b1',
      title: 'Auriculares inalámbricos con cancelación de ruido activa',
      price: 420,
      promoPrice: 350, // -17%
    },
    promoName: 'Oferta Web E2E',
  },
  mobile: {
    first: {
      id: 'f8422b84-c52d-4b0a-8a3a-5543b8ae9759',
      title: 'TV LG de alta calidad',
      price: 3000,
      promoPrice: 2400, // -20%
      searchQuery: 'TV LG',
    },
    second: {
      id: '0b0af8e0-a175-4052-908e-473e1d33c8b8',
      title: 'Tv Smart 24 pulgadas',
      price: 2000,
      promoPrice: 1700, // -15%
    },
    promoName: 'Oferta Mobile E2E',
  },
} as const

const SCREENSHOT_DIR = process.env.PROMO_SCREENSHOT_DIR || ''

async function maybeCapture(page: Page, name: string) {
  if (!SCREENSHOT_DIR) return
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false })
}

test.describe('Product Promotions E2E (Web + Mobile)', () => {
  test.describe.configure({ mode: 'serial' })

  test('T1: create promotion on published product, validate rules, verify detail & a11y', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const projectKey = testInfo.project.name === 'mobile' ? 'mobile' : 'chromium'
    const pair = PRODUCT_PAIRS[projectKey]
    const expectedFirstPct = Math.round(
      ((pair.first.price - pair.first.promoPrice) / pair.first.price) * 100
    )

    await login(page)
    await gotoReady(page, `/productos/${pair.first.id}`)
    await expect(page.getByRole('heading', { name: pair.first.title })).toBeVisible({
      timeout: 15_000,
    })

    // Ensure clean state if an earlier aborted run left a promotion attached
    const editPromoBtn = page.getByRole('button', { name: /editar promoción/i })
    if (await editPromoBtn.isVisible().catch(() => false)) {
      await editPromoBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: /quitar promoción/i }).click()
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })
      await expect(page.getByRole('button', { name: /agregar promoción/i })).toBeVisible({
        timeout: 10_000,
      })
    }

    await page.getByRole('button', { name: /agregar promoción/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Switch to "Crear nueva" if seller already has existing promotions
    const createNewTab = dialog.getByRole('button', { name: /crear nueva/i })
    if (await createNewTab.isVisible().catch(() => false)) {
      await createNewTab.click()
    }

    const nameInput = dialog.getByLabel(/nombre de la promoción/i)
    const priceInput = dialog.getByLabel(/precio de promoción/i)
    await nameInput.fill(pair.promoName)

    // Validation check: promo price >= regular price must be rejected with Spanish alert
    await priceInput.fill(String(pair.first.price + 50))
    await dialog.getByRole('button', { name: /guardar promoción/i }).click()
    await expect(
      dialog.getByRole('alert').filter({ hasText: /menor al precio normal/i })
    ).toBeVisible()

    // Percentage preset auto-calculates price, and seller can override manually
    await dialog.getByRole('button', { name: /aplicar 15% de descuento/i }).click()
    const autoPrice = Math.round(pair.first.price * 0.85 * 100) / 100
    await expect(priceInput).toHaveValue(String(autoPrice))

    // Override with seller's custom price and verify live storefront preview
    await priceInput.fill(String(pair.first.promoPrice))
    await expect(dialog.getByText(/así se verá en tu vitrina/i)).toBeVisible()
    await expect(dialog.getByText(`-${expectedFirstPct}%`).first()).toBeVisible()
    await assertNoHorizontalScroll(page)
    await maybeCapture(page, `${projectKey}-01-dialog-preview`)

    // Save promotion
    await dialog.getByRole('button', { name: /guardar promoción/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    // Verify product detail reflects promo name, promo price, strikethrough original, and discount %
    await expect(page.getByText(pair.promoName).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`-${expectedFirstPct}%`).first()).toBeVisible()
    await expect(
      page.getByText(`Bs ${pair.first.promoPrice.toLocaleString('es-BO')}`).first()
    ).toBeVisible()
    await expect(
      page.getByText(`Bs ${pair.first.price.toLocaleString('es-BO')}`).first()
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /editar promoción/i })).toBeVisible()

    await assertNoHorizontalScroll(page)
    await runAxeAudit(page)
    await page.getByRole('heading', { name: pair.first.title }).scrollIntoViewIfNeeded()
    await maybeCapture(page, `${projectKey}-02-product-detail`)
  })

  test('T2–T3: search effective price filter, storefront display, and reuse on second product', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const projectKey = testInfo.project.name === 'mobile' ? 'mobile' : 'chromium'
    const pair = PRODUCT_PAIRS[projectKey]
    const expectedFirstPct = Math.round(
      ((pair.first.price - pair.first.promoPrice) / pair.first.price) * 100
    )
    const expectedSecondPct = Math.round(
      ((pair.second.price - pair.second.promoPrice) / pair.second.price) * 100
    )

    // Verify Search API filters by effective promo price and returns promo fields
    const searchRes = await page.request.get(
      `/api/search?q=${encodeURIComponent(pair.first.searchQuery)}&priceMax=${pair.first.promoPrice + 20}`
    )
    expect(searchRes.ok()).toBeTruthy()
    const searchJson = (await searchRes.json()) as {
      products: Array<{
        id: string
        promo_name?: string | null
        promo_price?: number | null
      }>
    }
    const matched = searchJson.products.find((p) => p.id === pair.first.id)
    expect(
      matched,
      'Expected product to match effective promo price filter in /api/search'
    ).toBeTruthy()
    expect(matched?.promo_name).toBe(pair.promoName)
    expect(Number(matched?.promo_price)).toBe(pair.first.promoPrice)

    // Verify /buscar renders promo card cleanly
    await gotoReady(page, `/buscar?q=${encodeURIComponent(pair.first.searchQuery)}`)
    const searchCard = page
      .locator('li')
      .filter({ hasText: pair.first.title })
      .filter({ has: page.locator(`a[href="/vendedor/${DEV_USER_ID}"]`) })
      .first()
    await expect(searchCard).toBeVisible({ timeout: 15_000 })
    await expect(searchCard.getByText(pair.promoName)).toBeVisible()
    await expect(searchCard.getByText(`-${expectedFirstPct}%`)).toBeVisible()
    await assertNoHorizontalScroll(page)
    await searchCard.scrollIntoViewIfNeeded()
    await maybeCapture(page, `${projectKey}-03-search-results`)

    // Verify public seller profile /vendedor/[id] renders promo card cleanly
    await gotoReady(page, `/vendedor/${DEV_USER_ID}`)
    const sellerCard = page.locator('li').filter({ hasText: pair.first.title }).first()
    await expect(sellerCard).toBeVisible({ timeout: 15_000 })
    await expect(sellerCard.getByText(pair.promoName)).toBeVisible()
    await expect(sellerCard.getByText(`-${expectedFirstPct}%`)).toBeVisible()
    await assertNoHorizontalScroll(page)
    await sellerCard.scrollIntoViewIfNeeded()
    await maybeCapture(page, `${projectKey}-04-seller-storefront`)

    // Reuse the SAME promotion on a second product from /perfil/mis-productos with its own price
    await login(page)
    await gotoMyProductsPage(page)
    const secondCard = page.locator('li').filter({ hasText: pair.second.title }).first()
    await expect(secondCard).toBeVisible({ timeout: 15_000 })

    await secondCard
      .getByRole('button', { name: new RegExp(`Acciones para ${pair.second.title}`, 'i') })
      .click()

    const reuseMenuItem = page.getByRole('menuitem', {
      name: /agregar promoción|editar promoción/i,
    })
    await expect(reuseMenuItem).toBeVisible()
    await reuseMenuItem.click()

    const secondDialog = page.getByRole('dialog')
    await expect(secondDialog).toBeVisible()

    const useExistingBtn = secondDialog.getByRole('button', { name: /usar existente/i })
    await expect(useExistingBtn).toBeVisible({ timeout: 10_000 })
    await useExistingBtn.click()

    const existingSelect = secondDialog.getByRole('combobox')
    await existingSelect.click()
    await page
      .getByRole('option', { name: new RegExp(pair.promoName, 'i') })
      .first()
      .click()

    // Seller fixes an independent custom price for the second product
    await secondDialog.getByLabel(/precio de promoción/i).fill(String(pair.second.promoPrice))
    await expect(secondDialog.getByText(`-${expectedSecondPct}%`).first()).toBeVisible()

    await secondDialog.getByRole('button', { name: /guardar promoción/i }).click()
    await expect(secondDialog).toBeHidden({ timeout: 15_000 })

    // Verify BOTH products show the shared promotion name with independent prices and percentages
    const refreshedFirst = page.locator('li').filter({ hasText: pair.first.title }).first()
    const refreshedSecond = page.locator('li').filter({ hasText: pair.second.title }).first()
    await expect(refreshedFirst.getByText(pair.promoName)).toBeVisible({ timeout: 15_000 })
    await expect(refreshedFirst.getByText(`-${expectedFirstPct}%`)).toBeVisible()
    await expect(refreshedSecond.getByText(pair.promoName)).toBeVisible({ timeout: 15_000 })
    await expect(refreshedSecond.getByText(`-${expectedSecondPct}%`)).toBeVisible()
    await assertNoHorizontalScroll(page)
    await refreshedSecond.scrollIntoViewIfNeeded()
    await maybeCapture(page, `${projectKey}-05-mis-productos`)
  })

  test('T4–T5: edit wizard Step 3 validation + Step 4 preview, then clean up promotions', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000)
    const projectKey = testInfo.project.name === 'mobile' ? 'mobile' : 'chromium'
    const pair = PRODUCT_PAIRS[projectKey]

    // Avoid Linux WebKit software-compositor stalls on sticky backdrop-blur + slide animations
    if (projectKey === 'mobile') {
      await page.emulateMedia({ reducedMotion: 'reduce' })
    }

    await login(page)

    // Edit wizard shows promotion in Step 3 and prevents lowering base price <= promo price
    await gotoReady(page, `/productos/${pair.first.id}/editar`)
    await expect(page.getByRole('heading', { name: /editar producto/i })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByRole('heading', { name: /información básica/i })).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByRole('heading', { name: /detalles del producto/i })).toBeVisible({
      timeout: 10_000,
    })

    const wizardPromoPanel = page.locator('#wizard-promotion-panel')
    await expect(wizardPromoPanel).toBeVisible()
    await expect(wizardPromoPanel.getByLabel(/precio de promoción/i)).toHaveValue(
      String(pair.first.promoPrice)
    )

    // Lowering base price below promo price must block advancing to Step 4
    const basePriceInput = page.locator('#price')
    await basePriceInput.fill(String(pair.first.promoPrice - 50))
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(
      wizardPromoPanel.getByRole('alert').filter({ hasText: /menor al precio normal/i })
    ).toBeVisible()

    // Restore valid base price and advance to Step 4 review preview
    await basePriceInput.scrollIntoViewIfNeeded()
    await basePriceInput.fill(String(pair.first.price))
    await page.getByRole('button', { name: /siguiente/i }).click()
    await expect(page.getByRole('heading', { name: /revisar y publicar/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(pair.promoName).first()).toBeVisible()
    await assertNoHorizontalScroll(page)

    // Cleanup: remove promotions from both products and verify regular price returns
    for (const prod of [pair.first, pair.second]) {
      await gotoReady(page, `/productos/${prod.id}`)
      await expect(page.getByRole('button', { name: /editar promoción/i })).toBeVisible({
        timeout: 15_000,
      })
      await page.getByRole('button', { name: /editar promoción/i }).click()
      const removeDialog = page.getByRole('dialog')
      await expect(removeDialog).toBeVisible()
      await removeDialog.getByRole('button', { name: /quitar promoción/i }).click()
      await expect(removeDialog).toBeHidden({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /agregar promoción/i })).toBeVisible({
        timeout: 15_000,
      })
    }
  })
})
