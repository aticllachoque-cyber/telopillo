'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  parseSearchEntityType,
  getEntityTypeLabel,
  type SearchEntityType,
} from '@/components/search/SearchTypeTabs'
import { cn } from '@/lib/utils'

/** Entities offered in the header type selector. "todo" lands on the productos tab. */
const SELECTOR_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'productos', label: 'Productos' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'solicitudes', label: 'Solicitudes' },
  { value: 'personas', label: 'Personas' },
] as const

type SelectorValue = (typeof SELECTOR_OPTIONS)[number]['value']

/** Default placeholder per selector entity (voseo, F-5). */
const PLACEHOLDERS: Record<SelectorValue, string> = {
  todo: 'Buscar en Telopillo...',
  productos: 'Buscar productos...',
  negocios: 'Buscar negocios...',
  solicitudes: 'Buscar solicitudes...',
  personas: 'Buscar vendedores...',
}

function selectorValueToType(value: SelectorValue): SearchEntityType | null {
  return value === 'todo' ? null : (value as SearchEntityType)
}

function typeToSelectorValue(type: SearchEntityType): SelectorValue {
  return type
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
  /** F-1: show the [Todo ▾] entity selector before the input. */
  withTypeSelector?: boolean
  /** Called after a successful submit (e.g. close the mobile overlay). */
  onSubmitted?: () => void
}

export function SearchBar({
  placeholder,
  className = '',
  autoFocus = false,
  withTypeSelector = false,
  onSubmitted,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Selector state derived from the URL (type param); 'todo' when absent.
  const urlType = parseSearchEntityType(searchParams?.get('type'))
  const [selectorValue, setSelectorValue] = useState<SelectorValue>(
    withTypeSelector ? typeToSelectorValue(urlType) : 'todo'
  )

  useEffect(() => {
    setQuery(searchParams?.get('q') || '')
    if (withTypeSelector) {
      setSelectorValue(typeToSelectorValue(parseSearchEntityType(searchParams?.get('type'))))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    const params = new URLSearchParams()
    params.set('q', query.trim())
    const entityType = selectorValueToType(selectorValue)
    if (entityType) {
      params.set('type', entityType)
    }
    router.push(`/buscar?${params.toString()}`)

    onSubmitted?.()

    // Reset searching state after navigation
    setTimeout(() => setIsSearching(false), 500)
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const activePlaceholder =
    placeholder ?? (withTypeSelector ? PLACEHOLDERS[selectorValue] : PLACEHOLDERS.productos)
  const activeSelectorLabel = getEntityTypeLabel(selectorValueToType(selectorValue) ?? 'productos')

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center gap-2 ${className}`}
      role="search"
      aria-label={withTypeSelector ? 'Buscar en Telopillo' : 'Buscar productos'}
    >
      {/* F-1: entity selector — direct form child, before the input wrapper so the
          absolute search icon never overlaps it */}
      {withTypeSelector && (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            aria-label={`Buscar en ${activeSelectorLabel === 'productos' && selectorValue === 'todo' ? 'todo Telopillo' : activeSelectorLabel}`}
          >
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] shrink-0 gap-1 whitespace-nowrap px-3 font-normal text-muted-foreground sm:min-h-0"
            >
              {SELECTOR_OPTIONS.find((opt) => opt.value === selectorValue)?.label}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SELECTOR_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => setSelectorValue(opt.value)}
                className={cn(opt.value === selectorValue && 'bg-accent font-medium')}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={activePlaceholder}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          className="pl-9 pr-9 min-h-[44px] sm:min-h-0"
          autoFocus={autoFocus}
          disabled={isSearching}
          maxLength={200}
          aria-label={activePlaceholder}
        />
        {/* C3: Clear button with proper touch target */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            aria-label="Limpiar búsqueda"
            disabled={isSearching}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* I3: descriptive label when disabled */}
      <Button
        type="submit"
        disabled={!query.trim() || isSearching}
        className="min-h-[44px] sm:min-h-0 touch-manipulation"
        aria-label={!query.trim() ? 'Buscar (escribí un término primero)' : 'Buscar'}
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <>
            <Search className="h-4 w-4 sm:mr-2" aria-hidden />
            <span className="hidden sm:inline">Buscar</span>
          </>
        )}
      </Button>
    </form>
  )
}
