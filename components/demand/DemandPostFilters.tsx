'use client'

import { useId, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, BOLIVIA_DEPARTMENTS } from '@/lib/validations/product'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface DemandPostFiltersProps {
  category: string
  department: string
  sort: string
  /** When true, default URL sort is `relevance` (with search); used for filter badge counts. */
  hasSearchQuery: boolean
  onCategoryChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSortChange: (value: string) => void
  onClearFilters: () => void
  className?: string
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'most_offers', label: 'Más ofertas' },
  { value: 'expiring_soon', label: 'Por vencer' },
] as const

interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

function isActiveFilter(filter: ActiveFilter | null): filter is ActiveFilter {
  return filter !== null
}

export function DemandPostFilters({
  category,
  department,
  sort,
  hasSearchQuery,
  onCategoryChange,
  onDepartmentChange,
  onSortChange,
  onClearFilters,
  className,
}: DemandPostFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filtersPanelId = useId()
  const filtersHeadingId = useId()
  const filtersDescriptionId = useId()

  const defaultSort = hasSearchQuery ? 'relevance' : 'newest'
  const sortIsActive = sort !== defaultSort
  const activeCount = [category !== 'all', department !== 'all', sortIsActive].filter(
    Boolean
  ).length
  const hasActiveFilters = activeCount > 0
  const activeFilters = [
    category !== 'all'
      ? {
          key: 'category',
          label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
          onRemove: () => onCategoryChange('all'),
        }
      : null,
    department !== 'all'
      ? {
          key: 'department',
          label: department,
          onRemove: () => onDepartmentChange('all'),
        }
      : null,
    sortIsActive
      ? {
          key: 'sort',
          label: SORT_OPTIONS.find((opt) => opt.value === sort)?.label || sort,
          onRemove: () => onSortChange(defaultSort),
        }
      : null,
  ].filter(isActiveFilter)

  const filterContent = (
    <div
      className="space-y-5"
      role="group"
      aria-labelledby={filtersHeadingId}
      aria-describedby={filtersDescriptionId}
    >
      <p id={filtersDescriptionId} className="text-xs text-muted-foreground">
        Los filtros se aplican automáticamente al seleccionar.
      </p>

      {activeFilters.length > 0 && (
        <div className="space-y-2" aria-label="Filtros activos">
          <p className="text-xs font-medium text-muted-foreground">Activos</p>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onRemove}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-8 sm:px-2.5"
                aria-label={`Quitar filtro ${filter.label}`}
              >
                <span>{filter.label}</span>
                <X className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="filter-demand-category" className="text-sm">
          Categoría
        </Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger
            id="filter-demand-category"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Filtrar por categoría"
          >
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-demand-department" className="text-sm">
          Departamento
        </Label>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger
            id="filter-demand-department"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Filtrar por departamento"
          >
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {BOLIVIA_DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-demand-sort" className="text-sm">
          Ordenar por
        </Label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger
            id="filter-demand-sort"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Ordenar solicitudes"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <aside className={cn('space-y-4', className)} aria-label="Filtros de solicitudes">
      <span id={filtersHeadingId} className="sr-only">
        Filtros de solicitudes
      </span>
      <div className="hidden items-center justify-between sm:flex">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-sm"
            aria-label="Limpiar todos los filtros"
          >
            <X className="mr-1 size-4" aria-hidden />
            Limpiar
          </Button>
        )}
      </div>

      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[44px] w-full touch-manipulation justify-between"
          aria-expanded={isOpen}
          aria-controls={filtersPanelId}
          aria-label={`${isOpen ? 'Ocultar' : 'Mostrar'} filtros de solicitudes${
            activeCount > 0 ? `, ${activeCount} activos` : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
          </span>
          <span className="text-xs text-muted-foreground">{isOpen ? 'Ocultar' : 'Mostrar'}</span>
        </Button>
      </div>

      <div
        id={filtersPanelId}
        className={cn('mt-3 sm:mt-0', !isOpen && 'max-sm:hidden', 'sm:block')}
      >
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden />
            <h2 className="text-base font-semibold">Filtros</h2>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-sm"
              aria-label="Limpiar todos los filtros"
            >
              <X className="mr-1 size-4" aria-hidden />
              Limpiar
            </Button>
          )}
        </div>
        {filterContent}
      </div>
    </aside>
  )
}
