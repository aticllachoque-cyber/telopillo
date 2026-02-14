import Link from 'next/link'
import {
  PRODUCT_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
} from '@/lib/validations/product'
import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Hammer,
  Dumbbell,
  Baby,
  Sparkles,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  electronics: Smartphone,
  vehicles: Car,
  home: Home,
  fashion: Shirt,
  construction: Hammer,
  sports: Dumbbell,
  baby: Baby,
  beauty: Sparkles,
  books: BookOpen,
}

export const metadata = {
  title: 'Categorías - Telopillo.bo',
  description: 'Explora productos por categoría en el marketplace boliviano',
}

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-balance">Categorías</h1>
          <p className="text-muted-foreground">Explora productos por categoría</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCT_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICON_MAP[category]
            const label = CATEGORY_LABELS[category]
            const description = CATEGORY_DESCRIPTIONS[category]

            return (
              <Link
                key={category}
                href={`/buscar?category=${category}`}
                className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {Icon && <Icon className="h-6 w-6" aria-hidden />}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-base group-hover:text-primary transition-colors">
                    {label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
