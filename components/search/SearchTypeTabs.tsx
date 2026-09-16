'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

export type SearchEntityType = 'productos' | 'negocios' | 'solicitudes' | 'personas'

export const SEARCH_ENTITY_TYPES: SearchEntityType[] = [
  'productos',
  'negocios',
  'solicitudes',
  'personas',
]

const ENTITY_LABELS: Record<SearchEntityType, string> = {
  productos: 'Productos',
  negocios: 'Negocios',
  solicitudes: 'Solicitudes',
  personas: 'Personas',
}

function isValidEntityType(value: string | null): value is SearchEntityType {
  return value !== null && (SEARCH_ENTITY_TYPES as string[]).includes(value)
}

/** Parse + validate the `type` URL param; defaults to 'productos'. */
export function parseSearchEntityType(value: string | null): SearchEntityType {
  return isValidEntityType(value) ? value : 'productos'
}

export function getEntityTypeLabel(type: SearchEntityType): string {
  return ENTITY_LABELS[type]
}

interface SearchTypeTabsProps {
  activeType: SearchEntityType
  /** Result count per type; null = not loaded yet (badge hidden) */
  counts: Partial<Record<SearchEntityType, number | null>>
  onTypeChange: (type: SearchEntityType) => void
  className?: string
}

/**
 * Accessible tablist for switching search entity on /buscar.
 * Pattern: app/perfil/demandas/page.tsx tablist (roving tabindex + arrow keys).
 */
export function SearchTypeTabs({
  activeType,
  counts,
  onTypeChange,
  className,
}: SearchTypeTabsProps) {
  const tabRefs = useRef<Partial<Record<SearchEntityType, HTMLButtonElement | null>>>({})

  const focusTab = (type: SearchEntityType) => {
    onTypeChange(type)
    tabRefs.current[type]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, type: SearchEntityType) => {
    const index = SEARCH_ENTITY_TYPES.indexOf(type)
    const total = SEARCH_ENTITY_TYPES.length
    const neighbor = (delta: number): SearchEntityType =>
      SEARCH_ENTITY_TYPES[(((index + delta) % total) + total) % total] ?? 'productos'
    let next: SearchEntityType
    switch (event.key) {
      case 'ArrowRight':
        next = neighbor(1)
        break
      case 'ArrowLeft':
        next = neighbor(-1)
        break
      case 'Home':
        next = SEARCH_ENTITY_TYPES[0] ?? 'productos'
        break
      case 'End':
        next = SEARCH_ENTITY_TYPES[total - 1] ?? 'productos'
        break
      default:
        return
    }
    event.preventDefault()
    focusTab(next)
  }

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="tablist"
      aria-label="Tipo de búsqueda"
    >
      {SEARCH_ENTITY_TYPES.map((type) => {
        const active = type === activeType
        const count = counts[type]
        return (
          <button
            key={type}
            ref={(node) => {
              tabRefs.current[type] = node
            }}
            type="button"
            role="tab"
            id={`search-tab-${type}`}
            aria-selected={active}
            aria-controls="search-results-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onTypeChange(type)}
            onKeyDown={(event) => handleKeyDown(event, type)}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-muted'
            )}
          >
            {ENTITY_LABELS[type]}
            {count != null && (
              <span
                aria-hidden
                className={cn(
                  'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                  active ? 'bg-primary-foreground text-primary' : 'bg-muted text-foreground'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
