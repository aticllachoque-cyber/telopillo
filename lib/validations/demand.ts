import { z } from 'zod'
import { stripHtml } from './sanitize'
import { PRODUCT_CATEGORIES, BOLIVIA_DEPARTMENTS } from './product'

export const demandPostSchema = z
  .object({
    title: z
      .string()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres')
      .trim()
      .transform(stripHtml),

    description: z
      .string()
      .min(20, 'La descripción debe tener al menos 20 caracteres')
      .max(1000, 'La descripción no puede exceder 1000 caracteres')
      .trim()
      .transform(stripHtml),

    category: z.enum(PRODUCT_CATEGORIES, {
      message: 'Selecciona una categoría',
    }),

    subcategory: z.string().optional(),

    location_department: z.enum(BOLIVIA_DEPARTMENTS, {
      message: 'Selecciona un departamento',
    }),

    location_city: z.string().min(1, 'Selecciona una ciudad').trim(),

    price_min: z
      .number()
      .min(0, 'El precio mínimo debe ser mayor o igual a 0')
      .optional()
      .nullable(),

    price_max: z
      .number()
      .min(0, 'El precio máximo debe ser mayor o igual a 0')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.price_min != null && data.price_max != null) {
        return data.price_max >= data.price_min
      }
      return true
    },
    { message: 'El precio máximo debe ser mayor o igual al mínimo', path: ['price_max'] }
  )

export type DemandPostInput = z.infer<typeof demandPostSchema>

export const demandOfferSchema = z.object({
  demand_post_id: z.string().uuid(),
  product_id: z.string().uuid(),
  message: z
    .string()
    .max(500, 'El mensaje no puede exceder 500 caracteres')
    .trim()
    .transform(stripHtml)
    .optional()
    .nullable(),
})

export type DemandOfferInput = z.infer<typeof demandOfferSchema>
