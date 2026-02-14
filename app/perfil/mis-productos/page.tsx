'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default function MisProductosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Mis Productos - Telopillo.bo'
    checkAuthAndLoadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortOption])

  const checkAuthAndLoadProducts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError

      if (!user) {
        router.push('/login?redirect=/perfil/mis-productos')
        return
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
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden />
          <p className="text-muted-foreground mt-4" role="status" aria-live="polite">
            Cargando productos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver al perfil
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Productos</h1>
              <p className="text-muted-foreground mt-2">Gestiona tus publicaciones</p>
            </div>
            <Button asChild>
              <Link href="/publicar">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Publicar Nuevo
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Sort */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                  Estado
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="sold">Vendidos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex-1">
                <label htmlFor="sort-option" className="text-sm font-medium mb-2 block">
                  Ordenar por
                </label>
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value as SortOption)}
                >
                  <SelectTrigger id="sort-option">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                    <SelectItem value="price_desc">Precio: Mayor a menor</SelectItem>
                    <SelectItem value="price_asc">Precio: Menor a mayor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {products.length} producto{products.length !== 1 ? 's' : ''}
            </div>
            <ProductGrid products={products} onUpdate={handleUpdate} showActions={true} />
          </>
        ) : (
          /* Empty State */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-16 w-16 text-muted-foreground mb-4" aria-hidden />
              <h2 className="text-2xl font-semibold mb-2">No tienes productos</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {statusFilter === 'all'
                  ? 'Aún no has publicado ningún producto. ¡Publica tu primer producto ahora!'
                  : `No tienes productos ${statusFilter === 'active' ? 'activos' : statusFilter === 'sold' ? 'vendidos' : 'inactivos'}.`}
              </p>
              <Button asChild size="lg">
                <Link href="/publicar">
                  <Plus className="mr-2 h-5 w-5" aria-hidden />
                  Publicar Producto
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
