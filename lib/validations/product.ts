import { z } from 'zod'
import { stripHtml } from './sanitize'

// Product categories enum
export const PRODUCT_CATEGORIES = [
  'electronics',
  'vehicles',
  'home',
  'fashion',
  'construction',
  'sports',
  'baby',
  'toys',
  'beauty',
  'books',
] as const

// Product condition enum
export const PRODUCT_CONDITIONS = ['new', 'used_like_new', 'used_good', 'used_fair'] as const

// Bolivia departments
export const BOLIVIA_DEPARTMENTS = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
] as const

// Product validation schema
export const productSchema = z.object({
  title: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim()
    .transform(stripHtml),

  description: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .trim()
    .transform(stripHtml),

  category: z.enum(PRODUCT_CATEGORIES, {
    message: 'Selecciona una categoría',
  }),

  subcategory: z.string().optional(),

  price: z
    .number({
      message: 'El precio debe ser un número',
    })
    .min(1, 'El precio debe ser mayor a 0')
    .max(999999999, 'El precio es demasiado alto'),

  condition: z.enum(PRODUCT_CONDITIONS, {
    message: 'Selecciona el estado del producto',
  }),

  location_department: z.enum(BOLIVIA_DEPARTMENTS, {
    message: 'Selecciona un departamento',
  }),

  location_city: z
    .string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'El nombre de la ciudad es demasiado largo')
    .trim(),

  images: z
    .array(z.string().url('URL de imagen inválida'))
    .min(1, 'Debes subir al menos 1 imagen')
    .max(5, 'Puedes subir máximo 5 imágenes'),
})

// Type inference
export type ProductInput = z.infer<typeof productSchema>

// Partial schema for updates (all fields optional)
export const productUpdateSchema = productSchema.partial()

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

// Helper function to validate product data
export function validateProduct(data: unknown): {
  success: boolean
  data?: ProductInput
  errors?: z.ZodError
} {
  const result = productSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}

// Category labels for UI
export const CATEGORY_LABELS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  electronics: 'Electrónica',
  vehicles: 'Vehículos',
  home: 'Hogar y Jardín',
  fashion: 'Moda y Accesorios',
  construction: 'Construcción',
  sports: 'Deportes',
  baby: 'Para Bebés y Niños',
  toys: 'Juguetes y Juegos',
  beauty: 'Belleza y Salud',
  books: 'Libros y Educación',
}

// Category descriptions for browsing
export const CATEGORY_DESCRIPTIONS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  electronics: 'Celulares, laptops, tablets, audio, TV y más',
  vehicles: 'Autos, motos, bicicletas y accesorios',
  home: 'Muebles, electrodomésticos, decoración y jardín',
  fashion: 'Ropa, zapatos, bolsos y accesorios',
  construction: 'Materiales, herramientas y equipos',
  sports: 'Equipos deportivos, ropa y accesorios',
  baby: 'Ropa, coches y accesorios para bebés y niños',
  toys: 'Muñecas, juegos de mesa, puzzles, coleccionables y más',
  beauty: 'Cosméticos, cuidado personal y salud',
  books: 'Libros, cursos, material educativo',
}

// Category icons (Lucide icon names)
export const CATEGORY_ICONS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  electronics: 'Smartphone',
  vehicles: 'Car',
  home: 'Home',
  fashion: 'Shirt',
  construction: 'Hammer',
  sports: 'Dumbbell',
  baby: 'Baby',
  toys: 'Gamepad2',
  beauty: 'Sparkles',
  books: 'BookOpen',
}

// Condition labels for UI
export const CONDITION_LABELS: Record<(typeof PRODUCT_CONDITIONS)[number], string> = {
  new: 'Nuevo',
  used_like_new: 'Usado - Como nuevo',
  used_good: 'Usado - Buen estado',
  used_fair: 'Usado - Estado regular',
}

// Condition descriptions
export const CONDITION_DESCRIPTIONS: Record<(typeof PRODUCT_CONDITIONS)[number], string> = {
  new: 'Sin usar, en su empaque original',
  used_like_new: 'Usado pero en excelente estado, sin marcas visibles',
  used_good: 'Usado con signos normales de uso, totalmente funcional',
  used_fair: 'Usado con marcas visibles, pero funcional',
}
