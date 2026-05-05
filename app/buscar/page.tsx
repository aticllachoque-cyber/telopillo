'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Loader2, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface Product {
  id: string
  user_id: string
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
  // Seller info (from search RPC JOINs)
  seller_name: string | null
  seller_avatar_url: string | null
  seller_verification_level: number
  seller_business_name: string | null
  seller_business_slug: string | null
  seller_business_logo: string | null
  seller_whatsapp_phone?: string | null
  seller_business_whatsapp?: string | null
  seller_profile_phone?: string | null
}

interface SearchResponse {
  products: Product[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

const PAGE_SIZE = 24

function BuscarPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Buscar Productos</h1>
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-11 flex-1 max-w-xl" />
        <Skeleton className="h-11 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] lg:aspect-square rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BuscarPageContent() {
  const searchParams = useSearchParams()
  const query = searchParams?.get('q') || ''
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadedPage, setLoadedPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const searchParamsString = searchParams?.toString() || ''

  // Check if any search criteria is active (query or filters)
  const hasActiveSearch = !!(
    query ||
    searchParams?.get('category') ||
    searchParams?.get('condition') ||
    searchParams?.get('department') ||
    searchParams?.get('priceMin') ||
    searchParams?.get('priceMax')
  )

  const performSearch = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        // Build query string from all search params
        const params = new URLSearchParams(searchParamsString)
        params.set('page', String(pageToLoad))
        params.set('limit', String(PAGE_SIZE))

        const response = await fetch(`/api/search?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Error al buscar productos')
        }

        const data: SearchResponse = await response.json()
        setResults((current) => {
          if (!append || !current) return data
          const existingIds = new Set(current.products.map((product) => product.id))
          const uniqueNextProducts = data.products.filter((product) => !existingIds.has(product.id))
          return {
            ...data,
            products: [...current.products, ...uniqueNextProducts],
          }
        })
        setLoadedPage(pageToLoad)
        setHasMore(Boolean(data.hasMore))
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'Error al buscar productos')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [searchParamsString]
  )

  useEffect(() => {
    document.title = query ? `Buscar: ${query} - Telopillo` : 'Buscar Productos - Telopillo'

    // Always perform search (returns all products when no query/filters)
    setResults(null)
    setLoadedPage(1)
    setHasMore(false)
    performSearch(1, false)
  }, [performSearch, query])

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    performSearch(loadedPage + 1, true)
  }, [hasMore, isLoading, isLoadingMore, loadedPage, performSearch])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '600px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-balance">Buscar Productos</h1>

          {/* Search Bar */}
          <SearchBar autoFocus={!query} />
        </div>

        {/* Layout: Filters + Results */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <Card className="gap-0 border border-border/60 py-0 shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <SearchFilters />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="min-w-0 flex-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[4/3] lg:aspect-square rounded-lg" />
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
                <div
                  className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p className="text-sm text-muted-foreground">
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
                  {results.totalCount > 0 && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Mostrando {results.products.length} de {results.totalCount}
                    </p>
                  )}
                </div>

                {/* No Results State (I2: clear filters link) */}
                {results.totalCount === 0 && (
                  <div className="space-y-4">
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

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                      <p className="font-medium mb-1">¿No encontraste lo que buscas?</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Publica una solicitud y deja que los vendedores te contacten con ofertas.
                      </p>
                      <Link
                        href="/busco/publicar"
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                      >
                        Publicar lo que busco →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Product Grid */}
                {results.totalCount > 0 && (
                  <ProductGrid products={results.products} showStatusBadge={true} />
                )}

                {results.totalCount > 0 && (
                  <>
                    <div ref={loadMoreRef} className="h-1" aria-hidden />

                    <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                          Cargando más productos...
                        </div>
                      ) : hasMore ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadMore}
                          className="min-h-[44px] touch-manipulation sm:min-h-10"
                        >
                          Cargar más
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay más productos.</p>
                      )}
                    </div>
                  </>
                )}

                {/* Demand CTA at bottom of results */}
                {results.totalCount > 0 && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center mt-8">
                    <p className="font-medium mb-1">¿No encontraste exactamente lo que buscas?</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Publica una solicitud y deja que los vendedores te contacten.
                    </p>
                    <Link
                      href="/busco/publicar"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                    >
                      Publicar lo que busco →
                    </Link>
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

export default function BuscarPage() {
  return (
    <Suspense fallback={<BuscarPageSkeleton />}>
      <BuscarPageContent />
    </Suspense>
  )
}
