'use client'

import { useId, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
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
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'most_offers', label: 'Más ofertas' },
  { value: 'expiring_soon', label: 'Por vencer' },
] as const

export function DemandPostFilters({
  category,
  department,
  sort,
  hasSearchQuery,
  onCategoryChange,
  onDepartmentChange,
  onSortChange,
}: DemandPostFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filtersPanelId = useId()

  const defaultSort = hasSearchQuery ? 'relevance' : 'newest'
  const sortIsActive = sort !== defaultSort
  const activeCount = [category !== 'all', department !== 'all', sortIsActive].filter(
    Boolean
  ).length

  const filterContent = (
    <div
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-end"
      role="group"
      aria-label="Filtros de solicitudes"
    >
      <div className="space-y-1">
        <Label htmlFor="filter-category" className="text-xs sm:text-sm">
          Categoría
        </Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger
            id="filter-category"
            className="h-11 w-full touch-manipulation sm:h-9 sm:w-[160px] text-sm"
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
        <Label htmlFor="filter-department" className="text-xs sm:text-sm">
          Departamento
        </Label>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger
            id="filter-department"
            className="h-11 w-full touch-manipulation sm:h-9 sm:w-[160px] text-sm"
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

      <div className="space-y-1 col-span-2 sm:col-span-1">
        <Label htmlFor="filter-sort" className="text-xs sm:text-sm">
          Ordenar por
        </Label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger
            id="filter-sort"
            className="h-11 w-full touch-manipulation sm:h-9 sm:w-[180px] text-sm"
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
    <>
      <div className="sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[44px] w-full touch-manipulation justify-between"
          aria-expanded={isOpen}
          aria-controls={filtersPanelId}
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
        {filterContent}
      </div>
    </>
  )
}
