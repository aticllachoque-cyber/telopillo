'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DemandPostCard } from '@/components/demand/DemandPostCard'
import { DemandPostFilters } from '@/components/demand/DemandPostFilters'
import type { SearchDemandPost } from '@/types/database'

const PAGE_SIZE = 12

function BuscoPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container px-4 sm:px-6">
        <div className="h-10 w-48 rounded bg-muted animate-pulse mb-4" />
        <div className="h-6 w-96 rounded bg-muted animate-pulse mb-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
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

  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || 'all'
  const department = searchParams.get('department') || 'all'
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest')
  const page = parseInt(searchParams.get('page') || '1', 10)

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
    document.title = 'Busco / Necesito - Telopillo.bo'
    fetchDemands()
  }, [fetchDemands])

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
    updateParams({ q: searchInput, page: '' })
  }

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container px-4 sm:px-6">
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Busco / Necesito</h1>
              <p className="text-muted-foreground mt-1 text-pretty">
                Solicitudes de compradores buscando productos
              </p>
            </div>
            <Button asChild size="lg" className="hidden sm:inline-flex min-h-[44px] shrink-0">
              <Link href="/busco/publicar">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Publicar solicitud
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Buscar solicitudes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={200}
              className="pl-10 h-11"
              aria-label="Buscar solicitudes"
            />
          </div>
        </form>

        <Button asChild size="lg" className="sm:hidden w-full min-h-[44px] mb-4">
          <Link href="/busco/publicar">
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Publicar solicitud
          </Link>
        </Button>

        {/* Filters */}
        <div className="mb-6">
          <DemandPostFilters
            category={category}
            department={department}
            sort={sort}
            onCategoryChange={(val) => updateParams({ category: val, page: '' })}
            onDepartmentChange={(val) => updateParams({ department: val, page: '' })}
            onSortChange={(val) => updateParams({ sort: val, page: '' })}
          />
        </div>

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
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchDemands}>
              Reintentar
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-medium mb-2 text-balance">No hay solicitudes aún</p>
            <p className="text-muted-foreground mb-6 text-pretty">
              Sé el primero en publicar lo que buscas y recibe ofertas de vendedores.
            </p>
            <Button asChild size="lg" className="min-h-[44px]">
              <Link href="/busco/publicar">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Publicar lo que busco
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {totalCount} {totalCount === 1 ? 'solicitud' : 'solicitudes'}
              {q ? ` para "${q}"` : ''}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <DemandPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={page <= 1 ? 'Página anterior (no disponible)' : 'Página anterior'}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2 tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="min-h-[44px] min-w-[44px]"
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
