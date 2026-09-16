'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters, type SearchEnabledFilters } from '@/components/search/SearchFilters'
import {
  SearchTypeTabs,
  SEARCH_ENTITY_TYPES,
  parseSearchEntityType,
  type SearchEntityType,
} from '@/components/search/SearchTypeTabs'
import { BusinessResultCard } from '@/components/search/BusinessResultCard'
import { PersonResultCard } from '@/components/search/PersonResultCard'
import { ProductGrid } from '@/components/products/ProductGrid'
import { DemandPostCard } from '@/components/demand/DemandPostCard'
import { Loader2, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { fetchWithPolicy, getNetworkErrorMessage } from '@/lib/network/fetch'
import { buildSearchCacheKey, loadSearchCache, saveSearchCache } from '@/lib/offline/search-cache'
import type { SearchBusiness, SearchPerson, SearchDemandPost } from '@/types/database'

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

interface CommonEnvelope {
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

interface ProductsResponse extends CommonEnvelope {
  products: Product[]
}

interface DemandsResponse extends CommonEnvelope {
  demands: SearchDemandPost[]
}

interface BusinessesResponse extends CommonEnvelope {
  businesses: SearchBusiness[]
}

interface ProfilesResponse extends CommonEnvelope {
  profiles: SearchPerson[]
}

type SearchResponse = ProductsResponse | DemandsResponse | BusinessesResponse | ProfilesResponse

const ENDPOINTS: Record<SearchEntityType, string> = {
  productos: '/api/search',
  negocios: '/api/search-businesses',
  solicitudes: '/api/search-demands',
  personas: '/api/search-profiles',
}

/** URL params kept when switching to each entity type (F-4: strip the rest). */
const KEPT_PARAMS: Record<SearchEntityType, string[]> = {
  productos: ['q', 'category', 'condition', 'department', 'priceMin', 'priceMax', 'sort'],
  negocios: ['q', 'category', 'department', 'sort'],
  solicitudes: ['q', 'category', 'department', 'sort'],
  personas: ['q', 'department', 'sort'],
}

/** Filter blocks visible per entity type (F-4). */
const ENABLED_FILTERS: Record<SearchEntityType, SearchEnabledFilters> = {
  productos: {},
  negocios: { category: 'business', department: true, condition: false, price: false },
  solicitudes: { category: 'product', department: true, condition: false, price: false },
  personas: { category: false, department: true, condition: false, price: false },
}

/** Sort options offered per entity type (only products support price sort). */
const SORT_OPTIONS_BY_TYPE: Record<
  SearchEntityType,
  ReadonlyArray<'relevance' | 'newest' | 'price_asc' | 'price_desc'>
> = {
  productos: ['relevance', 'newest', 'price_asc', 'price_desc'],
  negocios: ['relevance', 'newest'],
  solicitudes: ['relevance', 'newest'],
  personas: ['relevance', 'newest'],
}

/** Per-entity UI copy (voseo, F-5). */
const ENTITY_LABELS: Record<SearchEntityType, string> = {
  productos: 'productos',
  negocios: 'negocios',
  solicitudes: 'solicitudes',
  personas: 'vendedores',
}

const ENTITY_EMPTY_TITLE: Record<SearchEntityType, string> = {
  productos: 'No encontramos productos',
  negocios: 'No encontramos negocios',
  solicitudes: 'No encontramos solicitudes',
  personas: 'No encontramos vendedores',
}

const PAGE_SIZE = 24
const SEARCH_CACHE_VERSION = 1
const TAB_COUNTS_DEBOUNCE_MS = 400

function BuscarPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Buscar</h1>
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
  const router = useRouter()
  const query = searchParams?.get('q') || ''
  const activeType = parseSearchEntityType(searchParams?.get('type'))
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadedPage, setLoadedPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedUpdatedAt, setCachedUpdatedAt] = useState<string | null>(null)
  const [tabCounts, setTabCounts] = useState<Partial<Record<SearchEntityType, number | null>>>({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const searchParamsString = searchParams?.toString() || ''
  const cacheKey = buildSearchCacheKey(`${activeType}:search`, searchParamsString)

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
        const endpoint = ENDPOINTS[activeType]
        let params: URLSearchParams

        if (activeType === 'productos') {
          // Reuse every URL param, but never leak the internal `type` param.
          params = new URLSearchParams(searchParamsString)
          params.delete('type')
        } else {
          params = new URLSearchParams()
          const kept = KEPT_PARAMS[activeType]
          for (const key of kept) {
            const value = searchParams?.get(key)
            if (value) params.set(key, value)
          }
        }
        params.set('page', String(pageToLoad))
        params.set('limit', String(PAGE_SIZE))

        const response = await fetchWithPolicy(`${endpoint}?${params.toString()}`, {
          timeoutMs: 12_000,
          retries: 1,
        })

        if (!response.ok) {
          throw new Error('Error al buscar')
        }

        const data = (await response.json()) as SearchResponse
        setResults((current) => {
          if (!append || !current) return data

          const currentItems: Array<{ id: string }> =
            'products' in current
              ? current.products
              : 'demands' in current
                ? current.demands
                : 'businesses' in current
                  ? current.businesses
                  : current.profiles
          const nextItems: Array<{ id: string }> =
            'products' in data
              ? data.products
              : 'demands' in data
                ? data.demands
                : 'businesses' in data
                  ? data.businesses
                  : data.profiles
          const itemsKey =
            'products' in current
              ? 'products'
              : 'demands' in current
                ? 'demands'
                : 'businesses' in current
                  ? 'businesses'
                  : 'profiles'

          const existingIds = new Set(currentItems.map((item) => item.id))
          const uniqueNext = nextItems.filter((item) => !existingIds.has(item.id))

          return {
            ...data,
            [itemsKey]: [...currentItems, ...uniqueNext],
          } as SearchResponse
        })
        setLoadedPage(pageToLoad)
        setHasMore(Boolean(data.hasMore))
        if (!append) {
          saveSearchCache(cacheKey, data, SEARCH_CACHE_VERSION)
          setCachedUpdatedAt(null)
        }
      } catch (err) {
        console.error('Search error:', err)
        if (!append) {
          const cached = loadSearchCache<SearchResponse>(cacheKey, SEARCH_CACHE_VERSION)
          if (cached) {
            setResults(cached.data)
            setLoadedPage(cached.data.page)
            setHasMore(Boolean(cached.data.hasMore))
            setCachedUpdatedAt(cached.updatedAt)
            setError(null)
            return
          }
        }
        setError(getNetworkErrorMessage(err, 'Error al buscar'))
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [activeType, cacheKey, searchParams, searchParamsString]
  )

  useEffect(() => {
    document.title = query ? `Buscar: ${query} - Telopillo` : 'Buscar - Telopillo'

    const cached = loadSearchCache<SearchResponse>(cacheKey, SEARCH_CACHE_VERSION)
    if (cached) {
      setResults(cached.data)
      setLoadedPage(cached.data.page)
      setHasMore(Boolean(cached.data.hasMore))
      setCachedUpdatedAt(cached.updatedAt)
    } else {
      setResults(null)
      setLoadedPage(1)
      setHasMore(false)
      setCachedUpdatedAt(null)
    }
    performSearch(1, false)
  }, [cacheKey, performSearch, query])

  // F-1: tab counters — one limit=1 request per non-active entity, debounced,
  // aborted on the next navigation commit.
  useEffect(() => {
    if (!hasActiveSearch) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const targets = SEARCH_ENTITY_TYPES.filter((type) => type !== activeType)
      try {
        const counts = await Promise.all(
          targets.map(async (type) => {
            let params: URLSearchParams
            if (type === 'productos') {
              params = new URLSearchParams(searchParamsString)
              params.delete('type')
            } else {
              params = new URLSearchParams()
              for (const key of KEPT_PARAMS[type]) {
                const value = searchParams?.get(key)
                if (value) params.set(key, value)
              }
            }
            params.set('page', '1')
            params.set('limit', '1')
            const res = await fetch(`${ENDPOINTS[type]}?${params.toString()}`, {
              signal: controller.signal,
            })
            if (!res.ok) throw new Error('count failed')
            const data = (await res.json()) as CommonEnvelope
            return [type, data.totalCount] as const
          })
        )
        setTabCounts(Object.fromEntries(counts))
      } catch {
        // Aborted or transient failure — leave previous counts in place.
      }
    }, TAB_COUNTS_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [activeType, hasActiveSearch, searchParams, searchParamsString])

  const handleTypeChange = useCallback(
    (nextType: SearchEntityType) => {
      if (nextType === activeType) return
      const params = new URLSearchParams()
      params.set('type', nextType)
      for (const key of KEPT_PARAMS[nextType]) {
        const value = searchParams?.get(key)
        if (value) params.set(key, value)
      }
      router.push(`/buscar?${params.toString()}`)
    },
    [activeType, router, searchParams]
  )

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

  const totalCount = results?.totalCount ?? 0
  const countsForTabs: Partial<Record<SearchEntityType, number | null>> = {
    ...tabCounts,
    [activeType]: results ? results.totalCount : null,
  }

  const renderResults = () => {
    if (!results) return null
    switch (activeType) {
      case 'productos':
        return 'products' in results ? (
          <ProductGrid products={results.products} showStatusBadge={true} />
        ) : null
      case 'negocios':
        return 'businesses' in results ? (
          <ul role="list" className="flex flex-col gap-3">
            {results.businesses.map((business) => (
              <BusinessResultCard key={business.id} business={business} />
            ))}
          </ul>
        ) : null
      case 'solicitudes':
        return 'demands' in results ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.demands.map((post) => (
              <DemandPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : null
      case 'personas':
        return 'profiles' in results ? (
          <ul role="list" className="flex flex-col gap-3">
            {results.profiles.map((person) => (
              <PersonResultCard key={person.id} person={person} />
            ))}
          </ul>
        ) : null
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-balance">Buscar</h1>

          {/* Search Bar */}
          <SearchBar autoFocus={!query} withTypeSelector />
        </div>

        {/* F-1: entity tabs (only when a search is active) */}
        {hasActiveSearch && (
          <div className="mb-6">
            <SearchTypeTabs
              activeType={activeType}
              counts={countsForTabs}
              onTypeChange={handleTypeChange}
            />
          </div>
        )}

        {/* Layout: Filters + Results */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <Card className="gap-0 border border-border/60 py-0 shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <SearchFilters
                    enabledFilters={ENABLED_FILTERS[activeType]}
                    sortOptions={SORT_OPTIONS_BY_TYPE[activeType]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="min-w-0 flex-1" id="search-results-panel" role="tabpanel">
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
                      Buscando {ENTITY_LABELS[activeType]}...
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
                  Usá la barra de búsqueda para encontrar productos por nombre, descripción o
                  categoría
                </p>
                <Link href="/categorias" className="text-primary hover:underline font-medium">
                  O explorá por categorías →
                </Link>
              </div>
            )}

            {/* Results */}
            {results && !isLoading && (
              <div>
                {cachedUpdatedAt && (
                  <div
                    className="mb-4 rounded-lg border bg-muted px-4 py-3 text-sm text-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    role="status"
                  >
                    <span>
                      Mostrando resultados guardados por una falla de conexión.{' '}
                      {`Última actualización: ${new Date(cachedUpdatedAt).toLocaleString('es-BO')}.`}
                    </span>
                    <button
                      type="button"
                      onClick={() => performSearch()}
                      className="font-medium underline underline-offset-2 text-left sm:text-right"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
                {/* C4: Results count in aria-live region */}
                <div
                  className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p className="text-sm text-muted-foreground">
                    {totalCount === 0 ? (
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
                        {totalCount} resultado{totalCount !== 1 ? 's' : ''}
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
                {totalCount === 0 && (
                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">{ENTITY_EMPTY_TITLE[activeType]}</h3>
                    <p className="text-foreground/80 mb-4">
                      Intentá con otras palabras clave o ajustá los filtros
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {hasActiveSearch && (
                        <Link
                          href={`/buscar${activeType === 'productos' ? '' : `?type=${activeType}`}`}
                          className="inline-flex items-center text-primary hover:underline font-medium min-h-[44px]"
                        >
                          Limpiar filtros y búsqueda
                        </Link>
                      )}
                      <Link
                        href="/categorias"
                        className="inline-flex items-center text-primary hover:underline font-medium min-h-[44px]"
                      >
                        Ver todas las categorías →
                      </Link>
                    </div>

                    {/* Demand CTA only for product results (F-4) */}
                    {activeType === 'productos' && (
                      <div className="border-t mt-6 pt-6">
                        <p className="font-medium mb-1">¿No encontraste lo que buscás?</p>
                        <p className="text-sm text-foreground/80 mb-3">
                          Publicá una solicitud y dejá que los vendedores te contacten con ofertas.
                        </p>
                        <Link
                          href="/busco/publicar"
                          className="inline-flex items-center text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                        >
                          Publicá lo que buscás →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Results by entity type */}
                {totalCount > 0 && renderResults()}

                {totalCount > 0 && (
                  <>
                    <div ref={loadMoreRef} className="h-1" aria-hidden />

                    <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                          Cargando más {ENTITY_LABELS[activeType]}...
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
                      ) : totalCount >= PAGE_SIZE ? (
                        <p className="text-sm text-muted-foreground">
                          No hay más {ENTITY_LABELS[activeType]}.
                        </p>
                      ) : null}
                    </div>
                  </>
                )}

                {/* Demand CTA at bottom of results (productos only, F-4) */}
                {totalCount > 0 && activeType === 'productos' && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center mt-8">
                    <p className="font-medium mb-1">¿No encontraste exactamente lo que buscás?</p>
                    <p className="text-sm text-foreground/80 mb-3">
                      Publicá una solicitud y dejá que los vendedores te contacten.
                    </p>
                    <Link
                      href="/busco/publicar"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
                    >
                      Publicá lo que buscás →
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
