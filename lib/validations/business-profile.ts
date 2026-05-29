import { z } from 'zod'
import { stripHtml } from './sanitize'

const optionalSanitizedText = (max: number) =>
  z.string().max(max).transform(stripHtml).optional().nullable()

const isPlatformUrl = (value: string, allowedHosts: string[]) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    return allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

const socialProfileSchema = (allowedHosts: string[], platform: string) =>
  z
    .string()
    .max(2048)
    .transform(stripHtml)
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^@?[\w.]{1,50}$/.test(value) || isPlatformUrl(value, allowedHosts),
      {
        message: `Ingresa un usuario válido o una URL de ${platform}`,
      }
    )

export const businessProfileSchema = z.object({
  business_name: z
    .string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .max(100, 'El nombre del negocio debe tener como máximo 100 caracteres')
    .transform(stripHtml),
  business_description: z
    .string()
    .max(500, 'La descripción debe tener como máximo 500 caracteres')
    .transform(stripHtml)
    .optional()
    .nullable(),
  business_category: optionalSanitizedText(100),
  nit: z
    .string()
    .regex(/^\d{1,15}$/, 'El NIT debe contener solo números')
    .optional()
    .nullable(),
  website_url: z.string().url('Debe ser una URL válida').optional().nullable().or(z.literal('')),
  social_facebook: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .nullable()
    .or(z.literal('')),
  social_instagram: socialProfileSchema(['instagram.com'], 'Instagram'),
  social_tiktok: socialProfileSchema(['tiktok.com'], 'TikTok'),
  social_whatsapp: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, 'Debe ser un número de teléfono válido')
    .optional()
    .nullable()
    .or(z.literal('')),
  business_hours: z.record(z.string(), z.string()).optional().nullable(),
  business_address: optionalSanitizedText(200),
  business_department: optionalSanitizedText(100),
  business_city: optionalSanitizedText(100),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

/**
 * Business categories available in the marketplace.
 * Used in the business profile form dropdown.
 */
export const BUSINESS_CATEGORIES = [
  'Tecnologia',
  'Ropa y Moda',
  'Hogar y Jardin',
  'Vehiculos',
  'Electrodomesticos',
  'Deportes',
  'Salud y Belleza',
  'Alimentos',
  'Servicios',
  'Construccion',
  'Educacion',
  'Mascotas',
  'Otros',
] as const

/**
 * Days of the week for business hours editor.
 * Labels in Spanish for the Bolivian market.
 */
export const BUSINESS_DAYS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miercoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sabado' },
  { key: 'dom', label: 'Domingo' },
] as const
