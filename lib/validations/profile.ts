import { z } from 'zod'
import { stripHtml } from './sanitize'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').transform(stripHtml),
  phone: z.string().optional().nullable(),
  location_department: z.string().min(1, 'Selecciona un departamento'),
  location_city: z.string().min(1, 'Selecciona una ciudad'),
})

export type ProfileInput = z.infer<typeof profileSchema>
