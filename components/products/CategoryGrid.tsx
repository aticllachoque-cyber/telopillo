'use client'

import type { KeyboardEvent } from 'react'
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/data/categories'
import { cn } from '@/lib/utils'

interface CategoryGridProps {
  value?: string
  onChange: (categoryId: string) => void
  error?: boolean
}

export function CategoryGrid({ value, onChange, error }: CategoryGridProps) {
  const selectedIndex = value ? CATEGORIES.findIndex((cat) => cat.id === value) : -1

  const handleArrowNavigation = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const columns = 3
    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % CATEGORIES.length
        break
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length
        break
      case 'ArrowDown':
        nextIndex = (currentIndex + columns) % CATEGORIES.length
        break
      case 'ArrowUp':
        nextIndex = (currentIndex - columns + CATEGORIES.length) % CATEGORIES.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = CATEGORIES.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextCategory = CATEGORIES[nextIndex]
    if (!nextCategory) return

    onChange(nextCategory.id)
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-testid="category-${nextCategory.id}"]`)
        ?.focus()
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label="Categoría del producto"
      aria-required="true"
      aria-invalid={error ? 'true' : 'false'}
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {CATEGORIES.map((cat, currentIndex) => {
        const Icon = CATEGORY_ICONS[cat.id]
        const isSelected = value === cat.id

        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (selectedIndex === -1 && currentIndex === 0) ? 0 : -1}
            data-testid={`category-${cat.id}`}
            onClick={() => onChange(cat.id)}
            onKeyDown={(event) => handleArrowNavigation(event, currentIndex)}
            className={cn(
              'flex flex-col items-center gap-1 sm:gap-2 rounded-lg border-2 px-2 py-2.5 sm:p-4 text-center transition-colors min-h-[72px] sm:min-h-[88px] touch-manipulation',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground',
              error && !value && 'border-destructive/50'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center size-8 sm:size-10 rounded-lg transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {Icon && <Icon className="size-5" aria-hidden="true" />}
            </div>
            <span className="text-[11px] sm:text-sm font-medium leading-tight line-clamp-2">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
