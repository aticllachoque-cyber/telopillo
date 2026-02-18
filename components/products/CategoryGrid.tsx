'use client'

import { CATEGORIES, CATEGORY_ICONS } from '@/lib/data/categories'
import { cn } from '@/lib/utils'

interface CategoryGridProps {
  value?: string
  onChange: (categoryId: string) => void
  error?: boolean
}

export function CategoryGrid({ value, onChange, error }: CategoryGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Categoría del producto"
      aria-required="true"
      aria-invalid={error ? 'true' : 'false'}
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id]
        const isSelected = value === cat.id

        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-testid={`category-${cat.id}`}
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 sm:gap-2 rounded-lg border-2 p-3 sm:p-4 text-center transition-colors min-h-[80px] sm:min-h-[88px] touch-manipulation',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground',
              error && !value && 'border-destructive/50'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center size-9 sm:size-10 rounded-lg transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {Icon && <Icon className="size-5" aria-hidden="true" />}
            </div>
            <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
