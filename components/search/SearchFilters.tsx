'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { X, SlidersHorizontal } from 'lucide-react'
import { useState, useMemo, useId, useEffect, useCallback } from 'react'
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  BOLIVIA_DEPARTMENTS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '@/lib/validations/product'

interface SearchFiltersProps {
  className?: string
  /** Callback when filters are applied (used to close mobile panel) */
  onApply?: () => void
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
] as const

interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

function isActiveFilter(filter: ActiveFilter | null): filter is ActiveFilter {
  return filter !== null
}

export function SearchFilters({ className = '', onApply }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const filtersPanelId = useId()
  const filtersHeadingId = useId()
  const filtersDescriptionId = useId()

  // Current filter values from URL
  const currentQuery = searchParams?.get('q')?.trim() || ''
  const currentCategory = searchParams?.get('category') || ''
  const currentCondition = searchParams?.get('condition') || ''
  const currentDepartment = searchParams?.get('department') || ''
  const currentPriceMin = searchParams?.get('priceMin') || ''
  const currentPriceMax = searchParams?.get('priceMax') || ''
  const defaultSort = currentQuery ? 'relevance' : 'newest'
  const currentSort = searchParams?.get('sort') || defaultSort
  const searchParamsString = searchParams?.toString() || ''
  const [pendingSearchParams, setPendingSearchParams] = useState(searchParamsString)

  useEffect(() => {
    setPendingSearchParams(searchParamsString)
  }, [searchParamsString])

  // C2: Use a key derived from URL to reset local state on back/forward
  const urlPriceKey = useMemo(
    () => `${currentPriceMin}|${currentPriceMax}`,
    [currentPriceMin, currentPriceMax]
  )

  // Local state for price inputs, resets when URL changes
  const [priceMin, setPriceMin] = useState(currentPriceMin)
  const [priceMax, setPriceMax] = useState(currentPriceMax)
  const [lastUrlKey, setLastUrlKey] = useState(urlPriceKey)

  // Sync without useEffect: compare keys on each render
  if (urlPriceKey !== lastUrlKey) {
    setPriceMin(currentPriceMin)
    setPriceMax(currentPriceMax)
    setLastUrlKey(urlPriceKey)
  }

  const applyFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(pendingSearchParams || searchParamsString)

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      params.delete('page')

      const nextParams = params.toString()
      setPendingSearchParams(nextParams)
      router.push(`/buscar?${nextParams}`)
      onApply?.()
    },
    [onApply, pendingSearchParams, router, searchParamsString]
  )

  const sortIsActive = currentSort !== defaultSort
  const activeFilters = [
    currentCategory
      ? {
          key: 'category',
          label:
            CATEGORY_LABELS[currentCategory as keyof typeof CATEGORY_LABELS] || currentCategory,
          onRemove: () => applyFilters({ category: '' }),
        }
      : null,
    currentCondition
      ? {
          key: 'condition',
          label:
            CONDITION_LABELS[currentCondition as keyof typeof CONDITION_LABELS] || currentCondition,
          onRemove: () => applyFilters({ condition: '' }),
        }
      : null,
    currentDepartment
      ? {
          key: 'department',
          label: currentDepartment,
          onRemove: () => applyFilters({ department: '' }),
        }
      : null,
    currentPriceMin || currentPriceMax
      ? {
          key: 'price',
          label: `Bs ${currentPriceMin || '0'}-${currentPriceMax || 'sin límite'}`,
          onRemove: () => {
            setPriceMin('')
            setPriceMax('')
            applyFilters({ priceMin: '', priceMax: '' })
          },
        }
      : null,
    sortIsActive
      ? {
          key: 'sort',
          label: SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label || currentSort,
          onRemove: () => applyFilters({ sort: '' }),
        }
      : null,
  ].filter(isActiveFilter)
  const activeCount = activeFilters.length
  const hasActiveFilters = activeCount > 0

  const clearAllFilters = () => {
    const params = new URLSearchParams(pendingSearchParams || searchParamsString)
    params.delete('category')
    params.delete('condition')
    params.delete('department')
    params.delete('priceMin')
    params.delete('priceMax')
    params.delete('sort')
    params.delete('page')
    const nextParams = params.toString()
    setPendingSearchParams(nextParams)
    router.push(`/buscar?${nextParams}`)
    onApply?.()
    setPriceMin('')
    setPriceMax('')
  }

  const applyPriceFilter = () => {
    applyFilters({ priceMin, priceMax })
  }

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
        <Label htmlFor="filter-product-category" className="text-sm">
          Categoría
        </Label>
        <Select
          value={currentCategory || '__all__'}
          onValueChange={(value) => applyFilters({ category: value === '__all__' ? '' : value })}
        >
          <SelectTrigger
            id="filter-product-category"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Filtrar por categoría"
          >
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-product-condition" className="text-sm">
          Condición
        </Label>
        <Select
          value={currentCondition || '__all__'}
          onValueChange={(value) => applyFilters({ condition: value === '__all__' ? '' : value })}
        >
          <SelectTrigger
            id="filter-product-condition"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Filtrar por condición"
          >
            <SelectValue placeholder="Todas las condiciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las condiciones</SelectItem>
            {PRODUCT_CONDITIONS.map((cond) => (
              <SelectItem key={cond} value={cond}>
                {CONDITION_LABELS[cond]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-product-department" className="text-sm">
          Departamento
        </Label>
        <Select
          value={currentDepartment || '__all__'}
          onValueChange={(value) => applyFilters({ department: value === '__all__' ? '' : value })}
        >
          <SelectTrigger
            id="filter-product-department"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Filtrar por departamento"
          >
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los departamentos</SelectItem>
            {BOLIVIA_DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Rango de precio (Bs)</legend>
        <div className="flex items-center gap-2">
          <Label htmlFor="price-min" className="sr-only">
            Precio mínimo
          </Label>
          <Input
            id="price-min"
            type="number"
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="min-h-[44px] w-full touch-manipulation"
            min="0"
            aria-label="Precio mínimo en bolivianos"
          />
          <span className="text-muted-foreground" aria-hidden>
            -
          </span>
          <Label htmlFor="price-max" className="sr-only">
            Precio máximo
          </Label>
          <Input
            id="price-max"
            type="number"
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="min-h-[44px] w-full touch-manipulation"
            min="0"
            aria-label="Precio máximo en bolivianos"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={applyPriceFilter}
          className="min-h-[44px] w-full touch-manipulation"
          disabled={!priceMin && !priceMax}
        >
          Aplicar precio
        </Button>
      </fieldset>

      <div className="space-y-1">
        <Label htmlFor="filter-product-sort" className="text-sm">
          Ordenar por
        </Label>
        <Select
          value={currentSort}
          onValueChange={(value) => applyFilters({ sort: value === defaultSort ? '' : value })}
        >
          <SelectTrigger
            id="filter-product-sort"
            className="min-h-[44px] w-full touch-manipulation"
            aria-label="Ordenar productos"
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
    <aside className={cn('space-y-4', className)} aria-label="Filtros de productos">
      <span id={filtersHeadingId} className="sr-only">
        Filtros de productos
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
            onClick={clearAllFilters}
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
          aria-label={`${isOpen ? 'Ocultar' : 'Mostrar'} filtros de productos${
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
              onClick={clearAllFilters}
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
