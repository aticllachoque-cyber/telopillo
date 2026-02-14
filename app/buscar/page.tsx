'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchSort } from '@/components/search/SearchSort'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Loader2, Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  useEffect(() => {
    document.title = query ? `Buscar: ${query} - Telopillo.bo` : 'Buscar Productos - Telopillo.bo'

    // Always perform search (returns all products when no query/filters)
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const performSearch = async () => {
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
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Buscar Productos</h1>

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
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
              </Button>
              <SearchSort showLabel={false} />
            </div>

            {/* Mobile Filters Panel */}
            {showMobileFilters && (
              <div className="lg:hidden mb-6 p-4 border rounded-lg bg-card">
                <SearchFilters />
              </div>
            )}

            {/* Desktop Sort */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div />
              <SearchSort />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" aria-hidden />
                <p className="text-muted-foreground" role="status" aria-live="polite">
                  Buscando productos...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div
                role="alert"
                className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-6 text-center"
              >
                <p className="font-medium mb-2">Error al buscar</p>
                <p className="text-sm">{error}</p>
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
                {/* Results Header */}
                <div className="mb-6">
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

                {/* No Results State */}
                {results.totalCount === 0 && (
                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No encontramos productos</h3>
                    <p className="text-muted-foreground mb-4">
                      Intenta con otras palabras clave o ajusta los filtros
                    </p>
                    <Link
                      href="/categorias"
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      Ver todas las categorías →
                    </Link>
                  </div>
                )}

                {/* Product Grid */}
                {results.totalCount > 0 && <ProductGrid products={results.products} />}

                {/* Pagination Info */}
                {results.totalPages > 1 && (
                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    Página {results.page} de {results.totalPages}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
