'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DemandPostCard } from '@/components/demand/DemandPostCard'
import { DemandPostFilters } from '@/components/demand/DemandPostFilters'
import type { SearchDemandPost } from '@/types/database'

const PAGE_SIZE = 12

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
  const [error, setError] = useState<string | null>(null)

  const q = (searchParams.get('q') || '').trim()
  const category = searchParams.get('category') || 'all'
  const department = searchParams.get('department') || 'all'
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest')
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1

  const [searchInput, setSearchInput] = useState(q)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const fetchDemands = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category !== 'all') params.set('category', category)
      if (department !== 'all') params.set('department', department)
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/search-demands?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch demands')

      const data = await res.json()
      setPosts(data.demands ?? [])
      setTotalCount(data.totalCount ?? 0)
    } catch (err) {
      console.error('Error fetching demands:', err)
      setError('No se pudieron cargar las solicitudes.')
    } finally {
      setIsLoading(false)
    }
  }, [q, category, department, sort, page])

  useEffect(() => {
    document.title = 'Solicitudes - Telopillo'
    fetchDemands()
  }, [fetchDemands])

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    if (updates.page === undefined) params.delete('page')
    router.push(`/busco?${params.toString()}`)
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
            <form onSubmit={handleSearch}>
              <div className="relative max-w-lg">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Buscar solicitudes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  maxLength={200}
                  className="h-11 pl-10"
                  aria-label="Buscar solicitudes"
                />
              </div>
            </form>

            <Button asChild size="lg" className="w-full min-h-[44px] touch-manipulation sm:hidden">
              <Link href="/busco/publicar">
                <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Publicar solicitud
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 gap-0 border border-border/60 py-0 shadow-md">
          <CardContent className="py-6">
            <DemandPostFilters
              category={category}
              department={department}
              sort={sort}
              hasSearchQuery={q.length > 0}
              onCategoryChange={(val) => updateParams({ category: val, page: '' })}
              onDepartmentChange={(val) => updateParams({ department: val, page: '' })}
              onSortChange={(val) => updateParams({ sort: val, page: '' })}
            />
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div aria-busy="true" aria-label="Cargando solicitudes">
            <div className="flex items-center gap-2 mb-4">
              <Loader2
                className="h-4 w-4 text-muted-foreground motion-safe:animate-spin"
                aria-hidden
              />
              <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
                Buscando solicitudes...
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                onClick={fetchDemands}
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border border-border/60 shadow-md">
            <CardContent className="py-12 text-center">
              <p className="mb-2 text-balance text-lg font-medium">No hay solicitudes aún</p>
              <p className="mx-auto mb-6 max-w-md text-pretty text-muted-foreground">
                Sé el primero en publicar lo que buscas y recibe ofertas de vendedores.
              </p>
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
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="tabular-nums">{totalCount}</span>{' '}
              {totalCount === 1 ? 'solicitud' : 'solicitudes'}
              {q ? (
                <>
                  {' '}
                  para <span className="font-medium text-foreground">&quot;{q}&quot;</span>
                </>
              ) : null}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <DemandPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
                aria-label="Paginación"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="min-h-[44px] min-w-0 touch-manipulation sm:min-h-9"
                  aria-label={page <= 1 ? 'Página anterior (no disponible)' : 'Página anterior'}
                >
                  Anterior
                </Button>
                <span className="px-2 text-sm text-muted-foreground tabular-nums">
                  Página <span className="tabular-nums">{page}</span> de{' '}
                  <span className="tabular-nums">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="min-h-[44px] min-w-0 touch-manipulation sm:min-h-9"
                  aria-label={
                    page >= totalPages ? 'Página siguiente (no disponible)' : 'Página siguiente'
                  }
                >
                  Siguiente
                </Button>
              </nav>
            )}
          </>
        )}
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
