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

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

/** Options offered for non-product entities (no price sorting). */
const ENTITY_SORT_OPTIONS: ReadonlyArray<'relevance' | 'newest'> = ['relevance', 'newest']

interface SearchSortProps {
  className?: string
  showLabel?: boolean
  /** Restrict offered options (unified search per-type). Default: all four. */
  options?: ReadonlyArray<SortOption>
}

export function SearchSort({
  className = '',
  showLabel = true,
  options = SORT_OPTIONS.map((opt) => opt.value),
}: SearchSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams?.get('sort') as SortOption) || 'relevance'

  const available = SORT_OPTIONS.filter((opt) => options.includes(opt.value))

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
      {/* I3: Always render label, sr-only when hidden visually */}
      <Label
        htmlFor="sort-select"
        className={showLabel ? 'whitespace-nowrap text-sm font-normal' : 'sr-only'}
      >
        Ordenar por:
      </Label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        {/* C3: touch target */}
        <SelectTrigger id="sort-select" className="w-full sm:w-[180px] min-h-[44px] sm:min-h-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {available.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { ENTITY_SORT_OPTIONS as SEARCH_ENTITY_SORT_OPTIONS }
