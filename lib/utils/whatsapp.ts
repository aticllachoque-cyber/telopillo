/**
 * Bolivia WhatsApp / wa.me helpers (E.164 digits without +).
 */

/** 591 + national number (typical mobile: 8 digits → 11 total). */
const MIN_WHATSAPP_DIGITS = 11
/** ITU-T E.164 maximum length (digits without +). */
const MAX_WHATSAPP_DIGITS = 15

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

/**
 * Builds https://wa.me/{digits} or wa.me/?text= when digits is null but text is set.
 * Encodes `prefilledText` when present.
 */
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
