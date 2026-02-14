'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc'

interface SearchSortProps {
  className?: string
  showLabel?: boolean
}

export function SearchSort({ className = '', showLabel = true }: SearchSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams?.get('sort') as SortOption) || 'relevance'

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'relevance') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Label htmlFor="sort-select" className="whitespace-nowrap text-sm font-normal">
          Ordenar por:
        </Label>
      )}
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-full sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevancia</SelectItem>
          <SelectItem value="newest">Más recientes</SelectItem>
          <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
          <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
