'use client'

import { CATEGORY_LABELS, BOLIVIA_DEPARTMENTS } from '@/lib/validations/product'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface DemandPostFiltersProps {
  category: string
  department: string
  sort: string
  onCategoryChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSortChange: (value: string) => void
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'most_offers', label: 'Más ofertas' },
  { value: 'expiring_soon', label: 'Por vencer' },
] as const

export function DemandPostFilters({
  category,
  department,
  sort,
  onCategoryChange,
  onDepartmentChange,
  onSortChange,
}: DemandPostFiltersProps) {
  return (
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
            className="h-11 w-full sm:w-[160px] sm:h-9 text-sm"
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
            className="h-11 w-full sm:w-[160px] sm:h-9 text-sm"
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
            className="h-11 w-full sm:w-[180px] sm:h-9 text-sm"
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
}
