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
  /** Route to push on change. Default: /buscar. */
  pathname?: string
  /** Value used when the URL has no sort param (and when clearing back to default). Default: relevance. */
  defaultSort?: SortOption
}

export function SearchSort({
  className = '',
  showLabel = true,
  options = SORT_OPTIONS.map((opt) => opt.value),
  pathname = '/buscar',
  defaultSort = 'relevance',
}: SearchSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const available = SORT_OPTIONS.filter((opt) => options.includes(opt.value))

  const requested = (searchParams?.get('sort') as SortOption) || defaultSort
  // Unknown/absent-for-this-page value (e.g. ?sort=relevance on a storefront) → safe fallback
  const fallback =
    available.find((opt) => opt.value === defaultSort)?.value ?? available[0]?.value ?? 'relevance'
  const currentSort = available.some((opt) => opt.value === requested) ? requested : fallback

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === defaultSort) {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    // Sort change invalidates the current page window
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
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
