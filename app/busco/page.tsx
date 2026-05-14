'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DemandPostCard } from '@/components/demand/DemandPostCard'
import { DemandPostFilters } from '@/components/demand/DemandPostFilters'
import type { SearchDemandPost } from '@/types/database'
import { fetchWithPolicy, getNetworkErrorMessage } from '@/lib/network/fetch'
import { buildSearchCacheKey, loadSearchCache, saveSearchCache } from '@/lib/offline/search-cache'

const PAGE_SIZE = 12
const DEMAND_SEARCH_CACHE_VERSION = 1

interface DemandSearchCachePayload {
  demands: SearchDemandPost[]
  totalCount: number
  page: number
  hasMore: boolean
}

function BuscoPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 rounded-xl border border-border/60 bg-card p-6 shadow-md">
          <div className="h-8 w-56 max-w-full rounded bg-muted animate-pulse" />
          <div className="mt-2 h-5 w-full max-w-md rounded bg-muted animate-pulse" />
          <div className="mt-6 h-11 w-full max-w-lg rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-md"
            >
              <div className="flex justify-between">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BuscoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [posts, setPosts] = useState<SearchDemandPost[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadedPage, setLoadedPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedUpdatedAt, setCachedUpdatedAt] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const pendingSearchParams = useRef(searchParams.toString())

  const q = (searchParams.get('q') || '').trim()
  const category = searchParams.get('category') || 'all'
  const department = searchParams.get('department') || 'all'
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest')
  const hasActiveSearch = Boolean(q || category !== 'all' || department !== 'all')
  const searchParamsString = searchParams.toString()
  const cacheKey = buildSearchCacheKey('demands:search', searchParamsString)

  const [searchInput, setSearchInput] = useState(q)

  useEffect(() => {
    pendingSearchParams.current = searchParamsString
  }, [searchParamsString])

  const fetchDemands = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (category !== 'all') params.set('category', category)
        if (department !== 'all') params.set('department', department)
        params.set('sort', sort)
        params.set('page', String(pageToLoad))
        params.set('limit', String(PAGE_SIZE))

        const res = await fetchWithPolicy(`/api/search-demands?${params.toString()}`, {
          timeoutMs: 12_000,
          retries: 1,
        })
        if (!res.ok) {
          throw new Error('No se pudieron cargar las solicitudes.')
        }

        const data = await res.json()
        const nextPosts = (data.demands ?? []) as SearchDemandPost[]
        setPosts((current) => {
          if (!append) return nextPosts
          const existingIds = new Set(current.map((post) => post.id))
          const uniqueNextPosts = nextPosts.filter((post) => !existingIds.has(post.id))
          return [...current, ...uniqueNextPosts]
        })
        setTotalCount(data.totalCount ?? 0)
        setHasMore(Boolean(data.hasMore))
        setLoadedPage(pageToLoad)
        if (!append) {
          saveSearchCache<DemandSearchCachePayload>(
            cacheKey,
            {
              demands: nextPosts,
              totalCount: data.totalCount ?? 0,
              page: pageToLoad,
              hasMore: Boolean(data.hasMore),
            },
            DEMAND_SEARCH_CACHE_VERSION
          )
          setCachedUpdatedAt(null)
        }
      } catch (err) {
        console.error('Error fetching demands:', err)
        if (!append) {
          const cached = loadSearchCache<DemandSearchCachePayload>(
            cacheKey,
            DEMAND_SEARCH_CACHE_VERSION
          )
          if (cached) {
            setPosts(cached.data.demands)
            setTotalCount(cached.data.totalCount)
            setLoadedPage(cached.data.page)
            setHasMore(Boolean(cached.data.hasMore))
            setCachedUpdatedAt(cached.updatedAt)
            setError(null)
            return
          }
        }
        setError(getNetworkErrorMessage(err, 'No se pudieron cargar las solicitudes.'))
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [cacheKey, q, category, department, sort]
  )

  useEffect(() => {
    document.title = 'Solicitudes - Telopillo'
    const cached = loadSearchCache<DemandSearchCachePayload>(cacheKey, DEMAND_SEARCH_CACHE_VERSION)
    if (cached) {
      setPosts(cached.data.demands)
      setTotalCount(cached.data.totalCount)
      setLoadedPage(cached.data.page)
      setHasMore(Boolean(cached.data.hasMore))
      setCachedUpdatedAt(cached.updatedAt)
    } else {
      setPosts([])
      setTotalCount(0)
      setLoadedPage(1)
      setHasMore(false)
      setCachedUpdatedAt(null)
    }
    fetchDemands(1, false)
  }, [cacheKey, fetchDemands])

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    fetchDemands(loadedPage + 1, true)
  }, [fetchDemands, hasMore, isLoading, isLoadingMore, loadedPage])

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

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(pendingSearchParams.current)
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    if (updates.page === undefined) params.delete('page')
    const nextParams = params.toString()
    pendingSearchParams.current = nextParams
    router.push(`/busco?${nextParams}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(pendingSearchParams.current)
    params.delete('category')
    params.delete('department')
    params.delete('sort')
    params.delete('page')
    const nextParams = params.toString()
    pendingSearchParams.current = nextParams
    router.push(`/busco?${nextParams}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput.trim(), page: '' })
  }

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="mb-6 border border-border/60 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-balance text-2xl font-bold sm:text-3xl">Solicitudes</h1>
                <p className="text-pretty mt-1 text-sm text-muted-foreground sm:text-base">
                  Solicitudes de compradores buscando productos
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="hidden min-h-[44px] shrink-0 touch-manipulation sm:inline-flex sm:min-h-10"
              >
                <Link href="/busco/publicar">
                  <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Publicar solicitud
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <form
              onSubmit={handleSearch}
              className="flex max-w-lg items-center gap-2"
              role="search"
              aria-label="Buscar solicitudes"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <label htmlFor="demand-search" className="sr-only">
                  Buscar solicitudes
                </label>
                <Input
                  id="demand-search"
                  type="search"
                  placeholder="Buscar solicitudes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  maxLength={200}
                  className="h-11 pr-11 pl-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute top-1/2 right-1 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-7 sm:min-h-0 sm:w-7 sm:min-w-0"
                    aria-label="Limpiar búsqueda de solicitudes"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                className="min-h-[44px] shrink-0 touch-manipulation sm:min-h-10"
                aria-label="Buscar solicitudes"
              >
                <Search className="h-4 w-4 sm:mr-2" aria-hidden />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </form>

            <Button asChild size="lg" className="w-full min-h-[44px] touch-manipulation sm:hidden">
              <Link href="/busco/publicar">
                <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Publicar solicitud
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24">
              <Card className="gap-0 border border-border/60 py-0 shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <DemandPostFilters
                    category={category}
                    department={department}
                    sort={sort}
                    hasSearchQuery={q.length > 0}
                    onCategoryChange={(val) => updateParams({ category: val, page: '' })}
                    onDepartmentChange={(val) => updateParams({ department: val, page: '' })}
                    onSortChange={(val) => updateParams({ sort: val, page: '' })}
                    onClearFilters={clearFilters}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div aria-busy="true" aria-label="Cargando solicitudes">
                <div className="mb-4 flex items-center gap-2">
                  <Loader2
                    className="h-4 w-4 text-muted-foreground motion-safe:animate-spin"
                    aria-hidden
                  />
                  <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                    Buscando solicitudes...
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between border-t pt-1">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <Card className="border border-border/60 shadow-md" role="alert">
                <CardContent className="py-12 text-center">
                  <p className="text-destructive mb-4 text-pretty">{error}</p>
                  <Button
                    variant="outline"
                    className="min-h-[44px] touch-manipulation sm:min-h-10"
                    onClick={() => fetchDemands(1, false)}
                  >
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card className="border border-border/60 shadow-md">
                <CardContent className="py-12 text-center">
                  <p className="mb-2 text-balance text-lg font-medium">
                    {hasActiveSearch ? 'No encontramos solicitudes' : 'No hay solicitudes aún'}
                  </p>
                  <p className="mx-auto mb-6 max-w-md text-pretty text-muted-foreground">
                    {hasActiveSearch
                      ? 'Intenta con otras palabras clave o ajusta los filtros.'
                      : 'Sé el primero en publicar lo que buscas y recibe ofertas de vendedores.'}
                  </p>
                  {hasActiveSearch && (
                    <Button
                      variant="outline"
                      className="mb-3 min-h-[44px] touch-manipulation sm:mr-3 sm:mb-0 sm:min-h-10"
                      onClick={() => router.push('/busco')}
                    >
                      Limpiar filtros y búsqueda
                    </Button>
                  )}
                  <Button asChild size="lg" className="min-h-[44px] touch-manipulation sm:min-h-10">
                    <Link href="/busco/publicar">
                      <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      Publicar lo que busco
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {cachedUpdatedAt && (
                  <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Mostrando solicitudes guardadas por una falla de conexión.{' '}
                    {`Última actualización: ${new Date(cachedUpdatedAt).toLocaleString('es-BO')}.`}
                  </div>
                )}
                <div
                  className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p className="text-sm text-muted-foreground">
                    <span className="tabular-nums">{totalCount}</span>{' '}
                    {totalCount === 1 ? 'solicitud' : 'solicitudes'}
                    {q ? (
                      <>
                        {' '}
                        para <span className="font-medium text-foreground">&quot;{q}&quot;</span>
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Mostrando {posts.length} de {totalCount}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => (
                    <DemandPostCard key={post.id} post={post} />
                  ))}
                </div>

                <div ref={loadMoreRef} className="h-1" aria-hidden />

                <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                      Cargando más solicitudes...
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
                    <p className="text-sm text-muted-foreground">No hay más solicitudes.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuscoPage() {
  return (
    <Suspense fallback={<BuscoPageSkeleton />}>
      <BuscoPageContent />
    </Suspense>
  )
}
