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
import { X, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  BOLIVIA_DEPARTMENTS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from '@/lib/validations/product'

interface SearchFiltersProps {
  className?: string
}

export function SearchFilters({ className = '' }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Current filter values from URL
  const currentCategory = searchParams?.get('category') || ''
  const currentCondition = searchParams?.get('condition') || ''
  const currentDepartment = searchParams?.get('department') || ''
  const currentPriceMin = searchParams?.get('priceMin') || ''
  const currentPriceMax = searchParams?.get('priceMax') || ''

  // Local state for inputs
  const [priceMin, setPriceMin] = useState(currentPriceMin)
  const [priceMax, setPriceMax] = useState(currentPriceMax)

  const hasActiveFilters =
    currentCategory || currentCondition || currentDepartment || currentPriceMin || currentPriceMax

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/buscar?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('category')
    params.delete('condition')
    params.delete('department')
    params.delete('priceMin')
    params.delete('priceMax')
    setPriceMin('')
    setPriceMax('')
    router.push(`/buscar?${params.toString()}`)
  }

  const applyPriceFilter = () => {
    applyFilters({ priceMin, priceMax })
  }

  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm"
            aria-label="Limpiar todos los filtros"
          >
            <X className="h-4 w-4 mr-1" aria-hidden />
            Limpiar
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-category">Categoría</Label>
        <Select
          value={currentCategory || '__all__'}
          onValueChange={(value) => applyFilters({ category: value === '__all__' ? '' : value })}
        >
          <SelectTrigger id="filter-category" className="w-full">
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

      {/* Condition Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-condition">Condición</Label>
        <Select
          value={currentCondition || '__all__'}
          onValueChange={(value) => applyFilters({ condition: value === '__all__' ? '' : value })}
        >
          <SelectTrigger id="filter-condition" className="w-full">
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

      {/* Department Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-department">Departamento</Label>
        <Select
          value={currentDepartment || '__all__'}
          onValueChange={(value) => applyFilters({ department: value === '__all__' ? '' : value })}
        >
          <SelectTrigger id="filter-department" className="w-full">
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

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label>Rango de precio (Bs)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full"
            min="0"
            aria-label="Precio mínimo"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full"
            min="0"
            aria-label="Precio máximo"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={applyPriceFilter}
          className="w-full"
          disabled={!priceMin && !priceMax}
        >
          Aplicar precio
        </Button>
      </div>
    </aside>
  )
}
