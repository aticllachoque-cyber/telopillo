'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  placeholder = 'Buscar productos...',
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with URL query param
  useEffect(() => {
    const urlQuery = searchParams?.get('q') || ''
    if (urlQuery !== query) {
      setQuery(urlQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)

    // Reset searching state after navigation
    setTimeout(() => setIsSearching(false), 500)
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center gap-2 ${className}`}
      role="search"
      aria-label="Buscar productos"
    >
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9 min-h-[44px] sm:min-h-0"
          autoFocus={autoFocus}
          disabled={isSearching}
          aria-label="Buscar productos"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
            aria-label="Limpiar búsqueda"
            disabled={isSearching}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      <Button
        type="submit"
        disabled={!query.trim() || isSearching}
        className="min-h-[44px] sm:min-h-0 touch-manipulation"
        aria-label="Buscar"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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
