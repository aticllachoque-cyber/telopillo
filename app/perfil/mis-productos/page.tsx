'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Package, ArrowLeft, ArrowUpDown, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ShareProfile } from '@/components/profile/ShareProfile'

type Product = {
  id: string
  title: string
  price: number
  images: string[]
  status: string
  location_city: string
  location_department: string
  views_count: number
  created_at: string
}

type StatusFilter = 'all' | 'active' | 'sold' | 'inactive'
type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

const ERROR_LOAD_PRODUCTS = 'Error al cargar productos. Comprueba tu conexión e inténtalo de nuevo.'
const ERROR_SESSION_OR_PAGE =
  'No se pudo verificar la sesión o cargar la página. Actualiza e inténtalo de nuevo.'

export default function MisProductosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Mis productos - Telopillo'
    checkAuthAndLoadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortOption])

  const checkAuthAndLoadProducts = async () => {
    setIsLoading(true)
    setError(null)

    /** Set immediately after auth so catch does not rely on stale React state for redirects */
    let authenticatedUserId: string | null = null

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login?redirect=/perfil/mis-productos')
        return
      }

      authenticatedUserId = user.id
      setUserId(user.id)

      const { data: business } = await supabase
        .from('business_profiles')
        .select('slug')
        .eq('id', user.id)
        .maybeSingle()

      if (business?.slug) {
        setBusinessSlug(business.slug)
      } else {
        setBusinessSlug(null)
      }

      // Build query
      let query = supabase.from('products').select('*').eq('user_id', user.id)

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      } else {
        // Exclude deleted products
        query = query.neq('status', 'deleted')
      }

      // Apply sorting
      switch (sortOption) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      if (!authenticatedUserId) {
        setError(ERROR_SESSION_OR_PAGE)
        return
      }
      setError(ERROR_LOAD_PRODUCTS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = () => {
    // Refresh products after any action
    checkAuthAndLoadProducts()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="mt-4 text-pretty text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error && !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md border border-destructive/50 shadow-md" role="alert">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-pretty text-destructive">{error}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                className="min-h-[44px] touch-manipulation sm:min-h-10"
                asChild
              >
                <Link href="/perfil">Volver al perfil</Link>
              </Button>
              <Button className="min-h-[44px] touch-manipulation sm:min-h-10" asChild>
                <Link href="/login?redirect=/perfil/mis-productos">Iniciar sesión</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="mt-4 text-pretty text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  const hasProducts = products.length > 0
  const publicProfileHref = businessSlug ? `/negocio/${businessSlug}` : `/vendedor/${userId}`

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/perfil"
          className="mb-4 inline-flex min-h-[44px] touch-manipulation items-center text-sm text-muted-foreground hover:text-foreground"
          aria-label="Volver al perfil"
        >
          <ArrowLeft className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          Volver al perfil
        </Link>

        <Card className="mb-6 border border-border/60 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-3 w-fit gap-1">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Vista personal
                </Badge>
                <h1 className="text-balance text-2xl font-bold sm:text-3xl">Mis productos</h1>
                <p className="text-pretty mt-1 text-sm text-muted-foreground sm:text-base">
                  Gestiona tus productos
                </p>
                <p className="text-pretty mt-3 max-w-2xl text-sm text-muted-foreground">
                  Esta vista es solo para ti. Si compartes tu perfil, otras personas verán tu perfil
                  público y tus productos publicados, sin estos controles de gestión.
                </p>
                <Button
                  asChild
                  variant="link"
                  className="mt-2 h-auto min-h-[44px] px-0 text-sm sm:min-h-10"
                >
                  <Link href={publicProfileHref}>
                    Ver perfil público
                    <ExternalLink className="ml-1 h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </Button>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                {userId && (
                  <ShareProfile profileId={userId} businessSlug={businessSlug} variant="compact" />
                )}
                {hasProducts && (
                  <Button
                    asChild
                    className="min-h-[44px] w-full touch-manipulation sm:min-h-10 sm:w-auto"
                  >
                    <Link href="/publicar" aria-label="Publicar producto">
                      <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      Publicar producto
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6 gap-0 border border-border/60 py-0 shadow-md">
          <CardContent className="space-y-4 py-6">
            <div role="group" aria-labelledby="status-filter-label">
              <span id="status-filter-label" className="sr-only">
                Filtrar por estado
              </span>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
                {(
                  [
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Activos' },
                    { value: 'sold', label: 'Vendidos' },
                    { value: 'inactive', label: 'Inactivos' },
                  ] as const
                ).map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={statusFilter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(value)}
                    aria-pressed={statusFilter === value}
                    className="min-h-[44px] shrink-0 touch-manipulation sm:min-h-9"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value as SortOption)}
                >
                  <SelectTrigger
                    id="sort-option"
                    className="h-11 min-w-0 max-w-full touch-manipulation sm:h-9 sm:w-[min(100%,280px)]"
                    aria-label="Ordenar por"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={4} collisionPadding={16}>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                    <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p
                className="text-sm text-muted-foreground tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {statusFilter !== 'all' ? (
                  <>
                    Mostrando <span className="tabular-nums">{products.length}</span>{' '}
                    {products.length !== 1 ? 'productos' : 'producto'}
                  </>
                ) : (
                  <>
                    <span className="tabular-nums">{products.length}</span>{' '}
                    {products.length !== 1 ? 'productos' : 'producto'}
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border border-destructive/50 shadow-md" role="alert">
            <CardContent className="p-6">
              <p className="text-pretty text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {products.length > 0 ? (
          <ProductGrid products={products} onUpdate={handleUpdate} showActions={true} />
        ) : (
          <Card className="border border-border/60 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="mb-2 text-balance text-lg font-semibold sm:text-xl">
                No tienes productos
              </h2>
              <p className="mx-auto mb-6 max-w-md text-pretty text-sm text-muted-foreground">
                {statusFilter === 'all'
                  ? 'Aún no has publicado ningún producto. Publica tu primer artículo cuando quieras.'
                  : `No tienes productos ${statusFilter === 'active' ? 'activos' : statusFilter === 'sold' ? 'vendidos' : 'inactivos'}.`}
              </p>
              <Button asChild size="lg" className="min-h-[44px] touch-manipulation sm:min-h-10">
                <Link href="/publicar">
                  <Plus className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                  Publicar producto
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
