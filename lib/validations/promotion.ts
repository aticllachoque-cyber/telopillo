import { z } from 'zod'
import { stripHtml } from './sanitize'
import {
  PROMOTION_MAX_DISCOUNT_PERCENT,
  PROMOTION_MIN_DISCOUNT_PERCENT,
  PROMOTION_NAME_MAX_LENGTH,
  PROMOTION_NAME_MIN_LENGTH,
} from '@/lib/utils/promotion'

const promoPriceSchema = z
  .number({
    message: 'El precio promocional debe ser un número',
  })
  .positive('El precio promocional debe ser mayor a 0')
  .max(999999999, 'El precio promocional es demasiado alto')

const defaultDiscountPercentSchema = z
  .number({
    message: 'El porcentaje de descuento debe ser un número',
  })
  .int('El porcentaje debe ser un número entero')
  .min(
    PROMOTION_MIN_DISCOUNT_PERCENT,
    `El descuento debe ser al menos ${PROMOTION_MIN_DISCOUNT_PERCENT}%`
  )
  .max(
    PROMOTION_MAX_DISCOUNT_PERCENT,
    `El descuento no puede superar ${PROMOTION_MAX_DISCOUNT_PERCENT}%`
  )
  .nullable()
  .optional()

const promotionNameSchema = z
  .string()
  .transform((val) => stripHtml(val).trim())
  .refine((val) => val.length >= PROMOTION_NAME_MIN_LENGTH, {
    message: `El nombre de la promoción debe tener al menos ${PROMOTION_NAME_MIN_LENGTH} caracteres`,
  })
  .refine((val) => val.length <= PROMOTION_NAME_MAX_LENGTH, {
    message: `El nombre de la promoción no puede exceder ${PROMOTION_NAME_MAX_LENGTH} caracteres`,
  })

/**
 * Payload accepted when attaching a promotion to a product:
 * - mode 'new': creates a new seller promotion (or updates an unshared existing one when editing)
 * - mode 'existing': attaches an existing seller promotion with a seller-defined price for this product
 */
export const productPromotionInputSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('new'),
    name: promotionNameSchema,
    promoPrice: promoPriceSchema,
    defaultDiscountPercent: defaultDiscountPercentSchema,
    /** When editing a product's current promotion, allows updating its name in-place if not shared. */
    replacePromotionId: z.string().uuid().optional(),
  }),
  z.object({
    mode: z.literal('existing'),
    promotionId: z.string().uuid('Seleccioná una promoción válida'),
    promoPrice: promoPriceSchema,
  }),
])

export type ProductPromotionInput = z.infer<typeof productPromotionInputSchema>

/**
 * Validates that the promotional price is strictly lower than the regular product price.
 */
export function validatePromoPriceAgainstBase(
  basePrice: number,
  promoPrice: number
): string | null {
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return 'Ingresá primero un precio válido para el producto'
  }
  if (!Number.isFinite(promoPrice) || promoPrice <= 0) {
    return 'El precio promocional debe ser mayor a 0'
  }
  if (promoPrice >= basePrice) {
    return 'El precio promocional debe ser menor al precio normal del producto'
  }
  return null
}
