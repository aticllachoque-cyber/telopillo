import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Hammer,
  Dumbbell,
  Baby,
  Gamepad2,
  Sparkles,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

export interface Category {
  id: string
  name: string
  icon: string
  subcategories: string[]
}

/** Centralized Lucide icon mapping for categories */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Smartphone,
  vehicles: Car,
  home: Home,
  fashion: Shirt,
  construction: Hammer,
  sports: Dumbbell,
  baby: Baby,
  toys: Gamepad2,
  beauty: Sparkles,
  books: BookOpen,
}

/** Get the Lucide icon component for a category */
export function getCategoryIcon(categoryId: string): LucideIcon | undefined {
  return CATEGORY_ICONS[categoryId]
}

export const CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electrónica y Tecnología',
    icon: '📱',
    subcategories: [
      'Smartphones',
      'Laptops y Computadoras',
      'Tablets',
      'TVs y Audio',
      'Cámaras y Fotografía',
      'Videojuegos y Consolas',
      'Accesorios',
      'Smart Home',
    ],
  },
  {
    id: 'vehicles',
    name: 'Vehículos y Repuestos',
    icon: '🚗',
    subcategories: [
      'Autos',
      'Motos',
      'Bicicletas',
      'Repuestos',
      'Llantas y Aros',
      'Accesorios',
      'Herramientas',
    ],
  },
  {
    id: 'home',
    name: 'Hogar y Muebles',
    icon: '🏠',
    subcategories: [
      'Sala',
      'Dormitorio',
      'Cocina',
      'Baño',
      'Jardín y Exterior',
      'Electrodomésticos',
      'Decoración',
    ],
  },
  {
    id: 'fashion',
    name: 'Moda y Accesorios',
    icon: '👕',
    subcategories: [
      'Ropa de Hombre',
      'Ropa de Mujer',
      'Ropa de Niños',
      'Zapatos',
      'Bolsos y Mochilas',
      'Joyas y Relojes',
      'Lentes de Sol',
    ],
  },
  {
    id: 'construction',
    name: 'Construcción y Ferretería',
    icon: '🔨',
    subcategories: [
      'Herramientas',
      'Materiales de Construcción',
      'Plomería',
      'Eléctrico',
      'Pintura y Suministros',
      'Equipo de Seguridad',
    ],
  },
  {
    id: 'sports',
    name: 'Deportes y Aire Libre',
    icon: '⚽',
    subcategories: [
      'Equipo de Gimnasio',
      'Equipo Deportivo',
      'Camping y Senderismo',
      'Bicicletas',
      'Deportes Acuáticos',
      'Deportes de Equipo',
    ],
  },
  {
    id: 'baby',
    name: 'Para Bebés y Niños',
    icon: '🧸',
    subcategories: [
      'Ropa de Bebé',
      'Coches y Sillas de Auto',
      'Muebles Infantiles',
      'Alimentación',
      'Pañales y Cuidado',
    ],
  },
  {
    id: 'toys',
    name: 'Juguetes y Juegos',
    icon: '🎮',
    subcategories: [
      'Juguetes para Bebés',
      'Muñecas y Peluches',
      'Juegos de Mesa',
      'Puzzles y Rompecabezas',
      'Juguetes Educativos',
      'Coleccionables y Figuras',
      'Juguetes al Aire Libre',
      'Disfraces y Role Play',
    ],
  },
  {
    id: 'beauty',
    name: 'Belleza y Salud',
    icon: '💄',
    subcategories: [
      'Cuidado de la Piel',
      'Maquillaje',
      'Cuidado del Cabello',
      'Perfumes',
      'Suplementos',
      'Equipo Médico',
    ],
  },
  {
    id: 'books',
    name: 'Libros y Educación',
    icon: '📚',
    subcategories: [
      'Libros',
      'Libros de Texto',
      'Cursos',
      'Material Escolar',
      'Instrumentos Musicales',
    ],
  },
]

// Helper function to get category by ID
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === id)
}

// Helper function to get subcategories by category ID
export function getSubcategories(categoryId: string): string[] {
  const category = getCategoryById(categoryId)
  return category?.subcategories || []
}

// Helper function to get category name
export function getCategoryName(id: string): string {
  const category = getCategoryById(id)
  return category?.name || id
}

// Helper function to get all category IDs
export function getCategoryIds(): string[] {
  return CATEGORIES.map((cat) => cat.id)
}

// Helper function to validate category and subcategory
export function isValidCategorySubcategory(categoryId: string, subcategory?: string): boolean {
  const category = getCategoryById(categoryId)
  if (!category) return false

  if (!subcategory) return true // Subcategory is optional

  return category.subcategories.includes(subcategory)
}
