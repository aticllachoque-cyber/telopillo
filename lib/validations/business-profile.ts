import { z } from 'zod'
import { stripHtml } from './sanitize'

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
  business_category: z.string().optional().nullable(),
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
  social_instagram: z.string().max(50).optional().nullable(),
  social_tiktok: z.string().max(50).optional().nullable(),
  social_whatsapp: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, 'Debe ser un número de teléfono válido')
    .optional()
    .nullable()
    .or(z.literal('')),
  business_hours: z.record(z.string(), z.string()).optional().nullable(),
  business_address: z.string().max(200).optional().nullable(),
  business_department: z.string().optional().nullable(),
  business_city: z.string().optional().nullable(),
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
