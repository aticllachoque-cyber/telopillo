import assert from 'node:assert/strict'
import { test } from 'node:test'

// Mirrors pure helpers in lib/utils/promotion.ts (unit tests run on plain Node without a TS loader).
const PROMOTION_MIN_DISCOUNT_PERCENT = 1
const PROMOTION_MAX_DISCOUNT_PERCENT = 95

function roundBobAmount(value) {
  return Math.round(value * 100) / 100
}

function calculatePromoPriceFromPercent(basePrice, discountPercent) {
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return roundBobAmount(basePrice)

  const clampedPercent = Math.min(
    PROMOTION_MAX_DISCOUNT_PERCENT,
    Math.max(PROMOTION_MIN_DISCOUNT_PERCENT, discountPercent)
  )
  const raw = roundBobAmount(basePrice * (1 - clampedPercent / 100))
  const maxAllowed = roundBobAmount(Math.max(0.01, basePrice - 0.01))
  return Math.max(0.01, Math.min(raw, maxAllowed))
}

function calculateDiscountPercent(basePrice, promoPrice) {
  if (!Number.isFinite(basePrice) || !Number.isFinite(promoPrice)) return 0
  if (basePrice <= 0 || promoPrice <= 0 || promoPrice >= basePrice) return 0
  const pct = Math.round(((basePrice - promoPrice) / basePrice) * 100)
  return Math.min(99, Math.max(0, pct))
}

function resolveActivePromotion(price, promo) {
  if (!promo) return null
  const basePrice = Number(price)
  const promoPrice = promo.promo_price != null ? Number(promo.promo_price) : NaN
  const promoName = (promo.promo_name ?? '').trim()

  if (!Number.isFinite(basePrice) || basePrice <= 0) return null
  if (!Number.isFinite(promoPrice) || promoPrice <= 0 || promoPrice >= basePrice) return null
  if (!promoName) return null

  return {
    promoId: promo.promo_id ?? null,
    promoName,
    promoPrice,
    originalPrice: basePrice,
    discountPercent: calculateDiscountPercent(basePrice, promoPrice),
    savingsAmount: roundBobAmount(basePrice - promoPrice),
  }
}

function extractProductPromotionFromJoin(productPrice, joined, now = new Date()) {
  const empty = { promo_id: null, promo_name: null, promo_price: null }
  if (!joined) return empty
  const row = Array.isArray(joined) ? joined[0] : joined
  if (!row) return empty

  const promoObj = Array.isArray(row.promotion) ? row.promotion[0] : row.promotion
  if (!promoObj || !promoObj.is_active) return empty

  const nowMs = now.getTime()
  if (promoObj.starts_at && new Date(promoObj.starts_at).getTime() > nowMs) return empty
  if (promoObj.ends_at && new Date(promoObj.ends_at).getTime() <= nowMs) return empty

  const numericPromoPrice = Number(row.promo_price)
  const numericProductPrice = Number(productPrice)
  if (
    !Number.isFinite(numericPromoPrice) ||
    !Number.isFinite(numericProductPrice) ||
    numericPromoPrice <= 0 ||
    numericPromoPrice >= numericProductPrice
  ) {
    return empty
  }

  return {
    promo_id: promoObj.id,
    promo_name: promoObj.name,
    promo_price: numericPromoPrice,
  }
}

test('calculatePromoPriceFromPercent computes accurate BOB promo prices', () => {
  assert.equal(calculatePromoPriceFromPercent(100, 5), 95)
  assert.equal(calculatePromoPriceFromPercent(500, 15), 425)
  assert.equal(calculatePromoPriceFromPercent(150, 5), 142.5)
  // Clamps to 95% max discount
  assert.equal(calculatePromoPriceFromPercent(100, 99), 5)
  // Invalid base price returns 0
  assert.equal(calculatePromoPriceFromPercent(0, 10), 0)
})

test('calculateDiscountPercent computes rounded percentage for display', () => {
  assert.equal(calculateDiscountPercent(500, 425), 15)
  assert.equal(calculateDiscountPercent(100, 95), 5)
  assert.equal(calculateDiscountPercent(300, 200), 33)
  assert.equal(calculateDiscountPercent(100, 100), 0)
  assert.equal(calculateDiscountPercent(100, 120), 0)
  assert.equal(calculateDiscountPercent(100, 0), 0)
})

test('resolveActivePromotion rejects invalid prices and empty names', () => {
  const valid = resolveActivePromotion(500, {
    promo_id: 'p-1',
    promo_name: 'Oferta fin de semana',
    promo_price: 400,
  })
  assert.deepEqual(valid, {
    promoId: 'p-1',
    promoName: 'Oferta fin de semana',
    promoPrice: 400,
    originalPrice: 500,
    discountPercent: 20,
    savingsAmount: 100,
  })

  assert.equal(resolveActivePromotion(500, { promo_name: 'Oferta', promo_price: 500 }), null)
  assert.equal(resolveActivePromotion(500, { promo_name: '   ', promo_price: 400 }), null)
  assert.equal(resolveActivePromotion(500, { promo_name: 'Oferta', promo_price: 600 }), null)
})

test('extractProductPromotionFromJoin handles both 1-to-1 object and array PostgREST shapes', () => {
  const now = new Date('2026-11-23T12:00:00Z')
  const row = {
    promo_price: '350.00',
    promotion: {
      id: 'promo-1',
      name: 'Liquidación',
      is_active: true,
      starts_at: null,
      ends_at: null,
    },
  }

  assert.deepEqual(extractProductPromotionFromJoin(500, row, now), {
    promo_id: 'promo-1',
    promo_name: 'Liquidación',
    promo_price: 350,
  })

  assert.deepEqual(extractProductPromotionFromJoin(500, [row], now), {
    promo_id: 'promo-1',
    promo_name: 'Liquidación',
    promo_price: 350,
  })

  // Inactive promotion is filtered out
  assert.deepEqual(
    extractProductPromotionFromJoin(
      500,
      { ...row, promotion: { ...row.promotion, is_active: false } },
      now
    ),
    { promo_id: null, promo_name: null, promo_price: null }
  )

  // Expired promotion is filtered out
  assert.deepEqual(
    extractProductPromotionFromJoin(
      500,
      { ...row, promotion: { ...row.promotion, ends_at: '2026-11-22T00:00:00Z' } },
      now
    ),
    { promo_id: null, promo_name: null, promo_price: null }
  )

  // Promo price >= regular price is filtered out
  assert.deepEqual(extractProductPromotionFromJoin(350, row, now), {
    promo_id: null,
    promo_name: null,
    promo_price: null,
  })
})

test('resolveActivePromotion handles sub-1% discount without producing negative or >99% values', () => {
  const tiny = resolveActivePromotion(680, {
    promo_id: 'p-tiny',
    promo_name: 'Descuento mínimo',
    promo_price: 679.99,
  })
  assert.deepEqual(tiny, {
    promoId: 'p-tiny',
    promoName: 'Descuento mínimo',
    promoPrice: 679.99,
    originalPrice: 680,
    discountPercent: 0,
    savingsAmount: 0.01,
  })

  // Negative, zero, and NaN promo prices are rejected
  assert.equal(resolveActivePromotion(680, { promo_name: 'Oferta', promo_price: -10 }), null)
  assert.equal(resolveActivePromotion(680, { promo_name: 'Oferta', promo_price: 0 }), null)
  assert.equal(resolveActivePromotion(680, { promo_name: 'Oferta', promo_price: Number.NaN }), null)
})
