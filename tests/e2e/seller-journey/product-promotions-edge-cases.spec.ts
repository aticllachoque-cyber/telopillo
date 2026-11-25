import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { assertNoHorizontalScroll, gotoReady, login } from '../../helpers'

function loadLocalEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const raw = fs.readFileSync(envPath, 'utf8')
  const env: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return env
}

const DEV_USER_ID = 'dc7a90d3-046c-43c3-8e1d-60a4052fd5f1'
const DEV_PRODUCT_A = {
  id: '0c1c3c98-d602-4056-a26a-43b04746bfbd',
  title: 'Mesa plegable multiuso 120 cm para oficina o estudio',
  price: 680,
}
const DEV_PRODUCT_B = {
  id: 'b3bed804-7a25-40af-bc27-28e3746930b1',
  title: 'Auriculares inalámbricos con cancelación de ruido activa',
  price: 420,
}
const DEV_INACTIVE_PRODUCT = {
  id: '17d699d6-38d4-477c-9f6a-21afeb643b53',
  title: 'iphon e123 mnax',
}

// Business storefront with valid WhatsApp (+59170667788) for buyer & cross-seller RLS tests
const BIZ_USER_ID = 'b1000001-0000-0000-0000-000000000006'
const BIZ_SLUG = 'tienda-electronica-la-paz'
const BIZ_PRODUCT = {
  id: 'c2000001-0000-0000-0000-000000000012',
  title: 'Audifonos Sony WH-1000XM5 nuevos',
  price: 1850,
}

const LONG_40_CHAR_PROMO = 'SUPEROFERTABLACKFRIDAYTELOPILLOBOLIVIA26' // exactly 40 chars, no spaces

test.describe('Product Promotions — Negative & Edge Cases (Web + Mobile)', () => {
  test.describe.configure({ mode: 'serial' })

  test('NE1: RLS blocks anonymous & cross-seller IDOR; DB triggers enforce price invariant & cleanup', async ({
    request,
  }, testInfo) => {
    // DB/RLS tests are browser-independent; run once on chromium project
    test.skip(testInfo.project.name !== 'chromium', 'DB/RLS verification runs once on chromium')

    const env = loadLocalEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!

    const serviceHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }
    const anonHeaders = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    }

    // 1. Anonymous user cannot insert into promotions or promotion_products
    const anonPromoRes = await request.post(`${supabaseUrl}/rest/v1/promotions`, {
      headers: anonHeaders,
      data: { user_id: DEV_USER_ID, name: 'Anon Hack' },
    })
    expect([401, 403]).toContain(anonPromoRes.status())

    // Sign in as dev@telopillo.test to obtain a real authenticated JWT
    const signInRes = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      data: { email: 'dev@telopillo.test', password: 'DevTest123' },
    })
    expect(signInRes.ok()).toBeTruthy()
    const { access_token: devJwt } = (await signInRes.json()) as { access_token: string }
    const devHeaders = {
      apikey: anonKey,
      Authorization: `Bearer ${devJwt}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }

    let devPromoId: string | null = null
    let bizPromoId: string | null = null

    try {
      // Seed one promotion for dev user and one for business user
      const devPromoCreate = await request.post(`${supabaseUrl}/rest/v1/promotions`, {
        headers: devHeaders,
        data: { user_id: DEV_USER_ID, name: 'RLS Dev Promo' },
      })
      expect(devPromoCreate.ok()).toBeTruthy()
      devPromoId = ((await devPromoCreate.json()) as Array<{ id: string }>)[0]!.id

      const bizPromoCreate = await request.post(`${supabaseUrl}/rest/v1/promotions`, {
        headers: serviceHeaders,
        data: { user_id: BIZ_USER_ID, name: 'RLS Biz Promo' },
      })
      expect(bizPromoCreate.ok()).toBeTruthy()
      bizPromoId = ((await bizPromoCreate.json()) as Array<{ id: string }>)[0]!.id

      // 2. IDOR: dev user tries to attach their own promotion to another seller's product
      //    Rejected by BEFORE INSERT ownership trigger (400) or RLS WITH CHECK (401/403)
      const idorAttachToOtherProduct = await request.post(
        `${supabaseUrl}/rest/v1/promotion_products`,
        {
          headers: devHeaders,
          data: {
            promotion_id: devPromoId,
            product_id: BIZ_PRODUCT.id,
            promo_price: 1500,
          },
        }
      )
      expect(idorAttachToOtherProduct.ok()).toBe(false)
      expect([400, 401, 403]).toContain(idorAttachToOtherProduct.status())

      // 3. IDOR: dev user tries to use another seller's promotion on dev's product
      const idorUseOtherPromo = await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
        headers: devHeaders,
        data: {
          promotion_id: bizPromoId,
          product_id: DEV_PRODUCT_A.id,
          promo_price: 500,
        },
      })
      expect(idorUseOtherPromo.ok()).toBe(false)
      expect([400, 401, 403]).toContain(idorUseOtherPromo.status())

      // 4. DB trigger blocks cross-owner even with service_role (defense in depth)
      const triggerCrossOwner = await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
        headers: serviceHeaders,
        data: {
          promotion_id: bizPromoId,
          product_id: DEV_PRODUCT_A.id,
          promo_price: 500,
        },
      })
      expect(triggerCrossOwner.status()).toBe(400)

      // 5. DB trigger blocks promo_price >= regular price (exact equality & higher)
      for (const badPrice of [DEV_PRODUCT_A.price, DEV_PRODUCT_A.price + 10]) {
        const triggerBadPrice = await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
          headers: serviceHeaders,
          data: {
            promotion_id: devPromoId,
            product_id: DEV_PRODUCT_A.id,
            promo_price: badPrice,
          },
        })
        expect(triggerBadPrice.status()).toBe(400)
      }

      // 6. DB cleanup trigger removes promotion_products when base price is lowered <= promo_price
      const validAttach = await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
        headers: devHeaders,
        data: {
          promotion_id: devPromoId,
          product_id: DEV_PRODUCT_A.id,
          promo_price: 550,
        },
      })
      expect(validAttach.ok()).toBeTruthy()

      // Lower product base price directly to 500 (<= 550 promo_price)
      const lowerPriceRes = await request.patch(
        `${supabaseUrl}/rest/v1/products?id=eq.${DEV_PRODUCT_A.id}`,
        {
          headers: serviceHeaders,
          data: { price: 500 },
        }
      )
      expect(lowerPriceRes.ok()).toBeTruthy()

      // Stale promotion_products row must be automatically deleted by trigger
      const checkRowRes = await request.get(
        `${supabaseUrl}/rest/v1/promotion_products?product_id=eq.${DEV_PRODUCT_A.id}`,
        { headers: serviceHeaders }
      )
      const remaining = (await checkRowRes.json()) as unknown[]
      expect(remaining.length).toBe(0)
    } finally {
      // Restore DEV_PRODUCT_A original price and clean up test promotions
      await request.patch(`${supabaseUrl}/rest/v1/products?id=eq.${DEV_PRODUCT_A.id}`, {
        headers: serviceHeaders,
        data: { price: DEV_PRODUCT_A.price },
      })
      if (devPromoId) {
        await request.delete(`${supabaseUrl}/rest/v1/promotions?id=eq.${devPromoId}`, {
          headers: serviceHeaders,
        })
      }
      if (bizPromoId) {
        await request.delete(`${supabaseUrl}/rest/v1/promotions?id=eq.${bizPromoId}`, {
          headers: serviceHeaders,
        })
      }
    }
  })

  test('NE2: negative form inputs (HTML-only, XSS, zero, negative, equal price, sub-1% discount)', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(60_000)
    const env = loadLocalEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!
    const serviceHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }

    const isMobile = testInfo.project.name === 'mobile'
    const targetProduct = isMobile
      ? { id: 'f8422b84-c52d-4b0a-8a3a-5543b8ae9759', title: 'TV LG de alta calidad', price: 3000 }
      : DEV_PRODUCT_A

    await login(page)

    try {
      await gotoReady(page, `/productos/${targetProduct.id}`)
      await expect(page.getByRole('heading', { name: targetProduct.title })).toBeVisible({
        timeout: 15_000,
      })

      const openPromoBtn = page.getByRole('button', { name: /agregar promoción|editar promoción/i })
      await openPromoBtn.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const createNewTab = dialog.getByRole('button', { name: /crear nueva/i })
      if (await createNewTab.isVisible().catch(() => false)) {
        await createNewTab.click()
      }

      const nameInput = dialog.getByLabel(/nombre de la promoción/i)
      const priceInput = dialog.getByLabel(/precio de promoción/i)
      const saveBtn = dialog.getByRole('button', { name: /guardar promoción/i })

      // 1. Exact equality (promo_price === basePrice) must fail
      await nameInput.fill('Prueba Borde')
      await priceInput.fill(String(targetProduct.price))
      await saveBtn.click()
      await expect(
        dialog.getByRole('alert').filter({ hasText: /menor al precio normal/i })
      ).toBeVisible()

      // 2. Zero and negative prices must fail
      for (const bad of ['0', '-50']) {
        await priceInput.fill(bad)
        await saveBtn.click()
        await expect(dialog.getByRole('alert').filter({ hasText: /mayor a 0/i })).toBeVisible()
      }

      // 3. 1-char name & whitespace-only name must fail
      await priceInput.fill(String(targetProduct.price - 10))
      for (const badName of ['A', '   ']) {
        await nameInput.fill(badName)
        await saveBtn.click()
        await expect(
          dialog.getByRole('alert').filter({ hasText: /mínimo 2 caracteres/i })
        ).toBeVisible()
      }

      // 4. HTML-only whitespace ("<b>  </b>") must be rejected by server Zod stripHtml().trim()
      await nameInput.fill('<b>  </b>')
      await saveBtn.click()
      await expect(
        dialog.getByRole('alert').filter({ hasText: /al menos 2 caracteres/i })
      ).toBeVisible({ timeout: 10_000 })

      // 5. XSS payload + sub-1% discount (price - 0.01 rounds to 0%) -> sanitized & no "-0%" badge
      await nameInput.fill('<b>Promo</b> Limpia')
      await priceInput.fill(String(targetProduct.price - 0.01))
      await saveBtn.click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })

      await expect(page.getByText('Promo Limpia').first()).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText('-0%')).toHaveCount(0)
      await assertNoHorizontalScroll(page)
    } finally {
      await request.delete(
        `${supabaseUrl}/rest/v1/promotion_products?product_id=eq.${targetProduct.id}`,
        { headers: serviceHeaders }
      )
      await request.delete(
        `${supabaseUrl}/rest/v1/promotions?name=eq.${encodeURIComponent('Promo Limpia')}`,
        { headers: serviceHeaders }
      )
    }
  })

  test('NE3 & NE4: editing price on shared promo does NOT duplicate rows; inactive product hides promo CTA', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'Shared-promo dedup & inactive CTA check runs once on chromium'
    )
    test.setTimeout(60_000)

    const env = loadLocalEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!
    const serviceHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }
    const sharedPromoName = 'Promo Compartida Unica'
    let promoId: string | null = null

    try {
      // Seed one shared promotion attached to BOTH Product A (550) and Product B (350)
      const createPromo = await request.post(`${supabaseUrl}/rest/v1/promotions`, {
        headers: serviceHeaders,
        data: { user_id: DEV_USER_ID, name: sharedPromoName },
      })
      promoId = ((await createPromo.json()) as Array<{ id: string }>)[0]!.id

      await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
        headers: serviceHeaders,
        data: [
          { promotion_id: promoId, product_id: DEV_PRODUCT_A.id, promo_price: 550 },
          { promotion_id: promoId, product_id: DEV_PRODUCT_B.id, promo_price: 350 },
        ],
      })

      await login(page)

      // Edit ONLY the price on Product A (from 550 -> 520), keeping the same promo name
      await gotoReady(page, `/productos/${DEV_PRODUCT_A.id}`)
      await page.getByRole('button', { name: /editar promoción/i }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByLabel(/precio de promoción/i).fill('520')
      await dialog.getByRole('button', { name: /guardar promoción/i }).click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })

      // Verify NO duplicate promotion row was created in DB
      const checkPromos = await request.get(
        `${supabaseUrl}/rest/v1/promotions?user_id=eq.${DEV_USER_ID}&name=eq.${encodeURIComponent(sharedPromoName)}`,
        { headers: serviceHeaders }
      )
      const promos = (await checkPromos.json()) as Array<{ id: string }>
      expect(
        promos.length,
        'Editing price of a shared promo must not duplicate the promotion row'
      ).toBe(1)

      // Verify Product A has 520 and Product B still has 350
      const checkLinks = await request.get(
        `${supabaseUrl}/rest/v1/promotion_products?promotion_id=eq.${promoId}&select=product_id,promo_price`,
        { headers: serviceHeaders }
      )
      const links = (await checkLinks.json()) as Array<{ product_id: string; promo_price: number }>
      expect(links.find((l) => l.product_id === DEV_PRODUCT_A.id)?.promo_price).toBe(520)
      expect(links.find((l) => l.product_id === DEV_PRODUCT_B.id)?.promo_price).toBe(350)

      // NE4: Inactive product owned by dev must NOT show "Agregar promoción" button
      await gotoReady(page, `/productos/${DEV_INACTIVE_PRODUCT.id}`)
      await expect(page.getByRole('heading', { name: DEV_INACTIVE_PRODUCT.title })).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('button', { name: /agregar promoción/i })).toHaveCount(0)
    } finally {
      if (promoId) {
        await request.delete(`${supabaseUrl}/rest/v1/promotions?id=eq.${promoId}`, {
          headers: serviceHeaders,
        })
      }
      await request.delete(
        `${supabaseUrl}/rest/v1/promotions?user_id=eq.${DEV_USER_ID}&name=eq.${encodeURIComponent(sharedPromoName)}`,
        { headers: serviceHeaders }
      )
    }
  })

  test('NE5: buyer view (non-owner) + WhatsApp promo prefill + mobile F-1 bar + 40-char no-space name on storefront', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(60_000)
    const isMobile = testInfo.project.name === 'mobile'

    const env = loadLocalEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY!
    const serviceHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }

    let bizPromoId: string | null = null
    const promoPrice = 1480 // -20% from 1850

    try {
      // Attach a 40-char unbroken promotion name to Tienda Electronica La Paz's product
      const createRes = await request.post(`${supabaseUrl}/rest/v1/promotions`, {
        headers: serviceHeaders,
        data: { user_id: BIZ_USER_ID, name: LONG_40_CHAR_PROMO },
      })
      expect(createRes.ok()).toBeTruthy()
      bizPromoId = ((await createRes.json()) as Array<{ id: string }>)[0]!.id

      const attachRes = await request.post(`${supabaseUrl}/rest/v1/promotion_products`, {
        headers: serviceHeaders,
        data: {
          promotion_id: bizPromoId,
          product_id: BIZ_PRODUCT.id,
          promo_price: promoPrice,
        },
      })
      expect(attachRes.ok()).toBeTruthy()

      // 1. Unauthenticated buyer visits business storefront /negocio/tienda-electronica-la-paz
      await gotoReady(page, `/negocio/${BIZ_SLUG}`)
      const bizCard = page.locator('li').filter({ hasText: BIZ_PRODUCT.title }).first()
      await expect(bizCard).toBeVisible({ timeout: 15_000 })
      await expect(bizCard.getByText(LONG_40_CHAR_PROMO)).toBeVisible()
      await expect(bizCard.getByText('-20%')).toBeVisible()
      await expect(bizCard.getByText('Bs 1.480')).toBeVisible()
      await assertNoHorizontalScroll(page)

      // 2. Unauthenticated buyer visits product detail /productos/[id]
      await gotoReady(page, `/productos/${BIZ_PRODUCT.id}`)
      await expect(page.getByRole('heading', { name: BIZ_PRODUCT.title })).toBeVisible({
        timeout: 15_000,
      })

      // Buyer must NOT see owner promotion controls
      await expect(
        page.getByRole('button', { name: /agregar promoción|editar promoción/i })
      ).toHaveCount(0)

      // Buyer sees promotion name, promo price, strikethrough regular price, and -20%
      await expect(page.getByText(LONG_40_CHAR_PROMO).first()).toBeVisible()
      await expect(page.getByText('-20%').first()).toBeVisible()
      await expect(page.getByText('Bs 1.480').first()).toBeVisible()
      await expect(page.getByText('Bs 1.850').first()).toBeVisible()

      // WhatsApp link must prefill the promotional price and promotion name
      // (use :visible because mobile F-1 compact bar is lg:hidden on desktop)
      const waLink = page.locator('a[href^="https://wa.me/"]:visible').first()
      await expect(waLink).toBeVisible()
      const href = await waLink.getAttribute('href')
      expect(href).toBeTruthy()
      const decodedHref = decodeURIComponent(href!)
      expect(decodedHref).toContain(LONG_40_CHAR_PROMO)
      expect(decodedHref).toContain('1.480')
      expect(decodedHref).toContain('1.850')

      // Mobile compact bar (F-1) must be visible on mobile with no horizontal scroll
      if (isMobile) {
        await expect(page.getByRole('link', { name: /contactar.*whatsapp/i }).first()).toBeVisible()
      }
      await assertNoHorizontalScroll(page)
    } finally {
      if (bizPromoId) {
        await request.delete(`${supabaseUrl}/rest/v1/promotions?id=eq.${bizPromoId}`, {
          headers: serviceHeaders,
        })
      }
    }
  })
})
