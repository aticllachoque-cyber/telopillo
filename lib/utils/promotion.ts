/**
 * Product promotion calculation, normalization, and formatting helpers.
 * Pure functions shared across client components, server components, and server actions.
 */

export const PROMOTION_NAME_MIN_LENGTH = 2
export const PROMOTION_NAME_MAX_LENGTH = 40
export const PROMOTION_MIN_DISCOUNT_PERCENT = 1
export const PROMOTION_MAX_DISCOUNT_PERCENT = 95
export const PROMOTION_QUICK_PERCENTS = [5, 10, 15, 20] as const

export interface ProductPromotionFields {
  promo_id?: string | null
  promo_name?: string | null
  promo_price?: number | null
}

export interface ResolvedProductPromotion {
  promoId: string | null
  promoName: string
  promoPrice: number
  originalPrice: number
  discountPercent: number
  savingsAmount: number
}

/**
 * PostgREST select fragment to join active product promotions onto a products query.
 */
export const PRODUCT_PROMOTION_SELECT =
  'promotion_products(promo_price, promotion:promotions(id, name, is_active, starts_at, ends_at))'

/**
 * Raw shape returned by Supabase PostgREST for `PRODUCT_PROMOTION_SELECT`.
 * Because `promotion_products.product_id` has a UNIQUE constraint, PostgREST may return
 * either a single object or a 1-element array depending on schema cache / client version.
 */
export interface RawPromotionProductJoinRow {
  promo_price: number | string
  promotion?:
    | {
        id: string
        name: string
        is_active: boolean
        starts_at: string | null
        ends_at: string | null
      }
    | Array<{
        id: string
        name: string
        is_active: boolean
        starts_at: string | null
        ends_at: string | null
      }>
    | null
}

/**
 * Round a currency amount in BOB to 2 decimal places without floating-point artifacts.
 */
export function roundBobAmount(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Compute a promotional price from a base price and discount percentage (1..95).
 * Always returns a value strictly less than `basePrice` and >= 0.01.
 */
export function calculatePromoPriceFromPercent(basePrice: number, discountPercent: number): number {
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

/**
 * Compute rounded discount percentage (0..99) for display in storefronts and cards.
 */
export function calculateDiscountPercent(basePrice: number, promoPrice: number): number {
  if (!Number.isFinite(basePrice) || !Number.isFinite(promoPrice)) return 0
  if (basePrice <= 0 || promoPrice <= 0 || promoPrice >= basePrice) return 0
  const pct = Math.round(((basePrice - promoPrice) / basePrice) * 100)
  return Math.min(99, Math.max(0, pct))
}

/**
 * Resolve valid active promotion details for display, or null if no valid promotion applies.
 */
export function resolveActivePromotion(
  price: number,
  promo: ProductPromotionFields | null | undefined
): ResolvedProductPromotion | null {
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

/**
 * Return the price buyers actually pay (promotional price when valid, regular price otherwise).
 */
export function getEffectiveProductPrice(price: number, promoPrice?: number | null): number {
  const base = Number(price)
  const promo = promoPrice != null ? Number(promoPrice) : NaN
  if (Number.isFinite(promo) && promo > 0 && Number.isFinite(base) && promo < base) {
    return promo
  }
  return base
}

/**
 * Format a BOB currency number for Bolivian Spanish UI (`Bs 1.250`).
 */
export function formatBobPrice(amount: number): string {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return 'Bs 0'
  return `Bs ${numeric.toLocaleString('es-BO', {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Normalize a PostgREST joined `promotion_products` field into flat `promo_id` / `promo_name` / `promo_price`.
 * Filters out inactive or out-of-window promotions and prices >= product base price.
 */
export function extractProductPromotionFromJoin(
  productPrice: number,
  joined: RawPromotionProductJoinRow | RawPromotionProductJoinRow[] | null | undefined,
  now: Date = new Date()
): Required<ProductPromotionFields> {
  const empty: Required<ProductPromotionFields> = {
    promo_id: null,
    promo_name: null,
    promo_price: null,
  }

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
