/**
 * Bolivia WhatsApp / wa.me helpers (E.164 digits without +).
 */

/** 591 + national number (typical mobile: 8 digits → 11 total). */
const MIN_WHATSAPP_DIGITS = 11
/** ITU-T E.164 maximum length (digits without +). */
const MAX_WHATSAPP_DIGITS = 15

/** When Bolivian normalization fails, still allow wa.me if digit strip looks plausible (legacy DB values). */
const FALLBACK_WA_MIN_DIGITS = 8

/**
 * Strips non-digits, prefixes 591 when missing, rejects implausible lengths.
 * Returns null if no digits remain or length is outside Bolivia WhatsApp norms.
 */
export function normalizeBolivianWhatsAppDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const normalized = digits.startsWith('591') ? digits : `591${digits}`
  if (normalized.length < MIN_WHATSAPP_DIGITS || normalized.length > MAX_WHATSAPP_DIGITS) {
    return null
  }
  return normalized
}

export type ResolvedSellerWhatsApp = {
  normalizedDigits: string | null
  /** True if any candidate string was non-empty after trim */
  anyRawPresent: boolean
}

/**
 * Prefer business WhatsApp; if missing or not normalizable, fall back to profile phone.
 */
export function resolveSellerWhatsAppDigits(
  businessSocialWhatsapp: string | null | undefined,
  profilePhone: string | null | undefined
): ResolvedSellerWhatsApp {
  const b = businessSocialWhatsapp?.trim() ?? ''
  const p = profilePhone?.trim() ?? ''
  const anyRawPresent = b.length > 0 || p.length > 0
  if (b) {
    const d = normalizeBolivianWhatsAppDigits(b)
    if (d) return { normalizedDigits: d, anyRawPresent: true }
  }
  if (p) {
    const d = normalizeBolivianWhatsAppDigits(p)
    if (d) return { normalizedDigits: d, anyRawPresent: true }
  }
  return { normalizedDigits: null, anyRawPresent }
}

/**
 * Search API: use split business/profile fields when present; otherwise legacy COALESCE field.
 */
export function resolveProductSearchContactFields(product: {
  seller_business_whatsapp?: string | null
  seller_profile_phone?: string | null
  seller_whatsapp_phone?: string | null
}): ResolvedSellerWhatsApp {
  const split = resolveSellerWhatsAppDigits(
    product.seller_business_whatsapp,
    product.seller_profile_phone
  )
  if (split.normalizedDigits) return split
  const legacy = product.seller_whatsapp_phone?.trim() ?? ''
  if (!legacy) return split
  const d = normalizeBolivianWhatsAppDigits(legacy)
  if (d) return { normalizedDigits: d, anyRawPresent: true }
  return {
    normalizedDigits: null,
    anyRawPresent: split.anyRawPresent || legacy.length > 0,
  }
}

/**
 * Builds https://wa.me/{digits} or wa.me/?text= when digits is null but text is set.
 * Encodes `prefilledText` when present.
 */
/**
 * Prefer {@link normalizeBolivianWhatsAppDigits}; if it fails, fall back to digits-only when
 * length is within a generic ITU-style window so edge-case stored numbers still get a CTA.
 */
export function buildWhatsAppMeUrlWithFallback(
  rawPhone: string | null | undefined,
  prefilledText?: string
): string | null {
  if (!rawPhone?.trim()) return null
  const normalized = normalizeBolivianWhatsAppDigits(rawPhone)
  if (normalized != null) {
    return buildWhatsAppMeUrl(normalized, prefilledText)
  }
  const digitsOnly = rawPhone.replace(/\D/g, '')
  if (digitsOnly.length >= FALLBACK_WA_MIN_DIGITS && digitsOnly.length <= MAX_WHATSAPP_DIGITS) {
    return buildWhatsAppMeUrl(digitsOnly, prefilledText)
  }
  return null
}

/** Only https wa.me / api.whatsapp.com — blocks javascript: and unrelated hosts. */
export function isSafeWhatsAppHref(href: string): boolean {
  if (!href || typeof href !== 'string') return false
  try {
    const u = new URL(href)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'wa.me' || host === 'api.whatsapp.com'
  } catch {
    return false
  }
}

export function buildWhatsAppMeUrl(phoneDigits: string | null, prefilledText?: string): string {
  if (phoneDigits) {
    const base = `https://wa.me/${phoneDigits}`
    if (prefilledText) return `${base}?text=${encodeURIComponent(prefilledText)}`
    return base
  }
  if (prefilledText) return `https://wa.me/?text=${encodeURIComponent(prefilledText)}`
  return 'https://wa.me/'
}

/** Default buyer message for a listing (Spanish UI copy). */
export function buildProductWhatsAppPrefillMessage(args: {
  productTitle: string
  price: number
  productAbsoluteUrl: string
}): string {
  const priceLabel = `Bs ${args.price.toLocaleString('es-BO')}`
  return [
    'Hola! Me interesa este producto en Telopillo:',
    '',
    args.productTitle,
    `Precio: ${priceLabel}`,
    `Ver publicación: ${args.productAbsoluteUrl}`,
  ].join('\n')
}
