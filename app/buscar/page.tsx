'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchSort } from '@/components/search/SearchSort'
import { ProductGrid } from '@/components/products/ProductGrid'
import {
  Loader2,
  Search as SearchIcon,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  condition: string
  category: string
  subcategory: string | null
  location_department: string
  location_city: string
  images: string[]
  status: string
  views_count: number
  created_at: string
  relevance_score?: number
}

interface SearchResponse {
  products: Product[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export default function BuscarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Check if any search criteria is active (query or filters)
  const hasActiveSearch = !!(
    query ||
    searchParams?.get('category') ||
    searchParams?.get('condition') ||
    searchParams?.get('department') ||
    searchParams?.get('priceMin') ||
    searchParams?.get('priceMax')
  )

  // Count active filters for badge (N2)
  const activeFilterCount = [
    searchParams?.get('category'),
    searchParams?.get('condition'),
    searchParams?.get('department'),
    searchParams?.get('priceMin'),
    searchParams?.get('priceMax'),
  ].filter(Boolean).length

  useEffect(() => {
    document.title = query ? `Buscar: ${query} - Telopillo.bo` : 'Buscar Productos - Telopillo.bo'

    // Always perform search (returns all products when no query/filters)
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Close mobile filters on Escape (I4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileFilters) {
        setShowMobileFilters(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMobileFilters])

  const performSearch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query string from all search params
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (!params.has('limit')) {
        params.set('limit', '24')
      }

      const response = await fetch(`/api/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al buscar productos')
      }

      const data: SearchResponse = await response.json()
      setResults(data)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Error al buscar productos')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // C1: Pagination navigation
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-balance">Buscar Productos</h1>

          {/* Search Bar */}
          <SearchBar autoFocus={!query} />
        </div>

        {/* Layout: Filters + Results */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-24">
              <SearchFilters />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filters Button + Sort */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
                aria-expanded={showMobileFilters}
                aria-controls="mobile-filters-panel"
                aria-label={showMobileFilters ? 'Cerrar filtros' : 'Abrir filtros'}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <SearchSort showLabel={false} />
            </div>

            {/* Mobile Filters Panel */}
            {showMobileFilters && (
              <div
                id="mobile-filters-panel"
                role="region"
                aria-label="Filtros de búsqueda"
                className="lg:hidden mb-6 p-4 border rounded-lg bg-card"
              >
                <SearchFilters onApply={() => setShowMobileFilters(false)} />
              </div>
            )}

            {/* Desktop Sort */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div />
              <SearchSort />
            </div>

            {/* Loading State — skeleton grid (I4) */}
            {isLoading && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 text-primary motion-safe:animate-spin"
                      aria-hidden
                    />
                    <p className="text-muted-foreground" role="status" aria-live="polite">
                      Buscando productos...
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square rounded-lg" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State (I1: retry button) */}
            {error && !isLoading && (
              <div
                role="alert"
                className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-6 text-center"
              >
                <p className="font-medium mb-2">Error al buscar</p>
                <p className="text-sm mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={() => performSearch()}>
                  Reintentar
                </Button>
              </div>
            )}

            {/* No Query State — only show when no search criteria at all */}
            {!hasActiveSearch && !isLoading && !results && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <SearchIcon className="h-16 w-16 text-muted-foreground/50 mb-4" aria-hidden />
                <h2 className="text-xl font-semibold mb-2">¿Qué estás buscando?</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Usa la barra de búsqueda para encontrar productos por nombre, descripción o
                  categoría
                </p>
                <Link href="/categorias" className="text-primary hover:underline font-medium">
                  O explora por categorías →
                </Link>
              </div>
            )}

            {/* Results */}
            {results && !isLoading && (
              <div>
                {/* C4: Results count in aria-live region */}
                <div className="mb-6" role="status" aria-live="polite" aria-atomic="true">
                  <p className="text-muted-foreground">
                    {results.totalCount === 0 ? (
                      <>
                        No se encontraron resultados
                        {query && (
                          <>
                            {' '}
                            para <strong>{query}</strong>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {results.totalCount} resultado{results.totalCount !== 1 ? 's' : ''}
                        {query && (
                          <>
                            {' '}
                            para <strong>{query}</strong>
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* No Results State (I2: clear filters link) */}
                {results.totalCount === 0 && (
                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No encontramos productos</h3>
                    <p className="text-muted-foreground mb-4">
                      Intenta con otras palabras clave o ajusta los filtros
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {hasActiveSearch && (
                        <Link
                          href="/buscar"
                          className="inline-flex items-center text-primary hover:underline font-medium"
                        >
                          Limpiar filtros y búsqueda
                        </Link>
                      )}
                      <Link
                        href="/categorias"
                        className="inline-flex items-center text-primary hover:underline font-medium"
                      >
                        Ver todas las categorías →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Product Grid */}
                {results.totalCount > 0 && <ProductGrid products={results.products} />}

                {/* C1: Pagination Controls */}
                {results.totalPages > 1 && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-2"
                    aria-label="Paginación de resultados"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={results.page <= 1}
                      onClick={() => goToPage(results.page - 1)}
                      className="min-h-[44px] sm:min-h-0 touch-manipulation"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" aria-hidden />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums px-3">
                      Página {results.page} de {results.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!results.hasMore}
                      onClick={() => goToPage(results.page + 1)}
                      className="min-h-[44px] sm:min-h-0 touch-manipulation"
                      aria-label="Página siguiente"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
                    </Button>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
