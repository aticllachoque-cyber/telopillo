'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useSnackbar } from '@/components/ui/snackbar'
import { ProductActions } from '@/components/products/ProductActions'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import { ChevronDown, ChevronUp, Eye, MessageCircle, Package, Star } from 'lucide-react'
import { getProductPath } from '@/lib/utils/publicRoutes'
import { shouldBypassNextImageOptimization } from '@/lib/utils/image'

const MAX_FEATURED = 4

export interface CatalogProduct {
  id: string
  title: string
  price: number
  images: string[]
  status: string
  category: string
  views_count: number
  contacts_count: number
  is_featured: boolean
  display_order: number | null
  created_at: string
}

interface CatalogManagerProps {
  products: CatalogProduct[]
  businessSlug: string
  onUpdate: () => void
}

/**
 * Business-mode catalog manager: groups the seller's active listings by
 * category and lets them star highlights (max 4) and reorder within the
 * group. Order persists as a global `display_order` sequence on products.
 */
export function CatalogManager({ products, businessSlug, onUpdate }: CatalogManagerProps) {
  const supabase = createClient()
  const { showSnackbar } = useSnackbar()
  const [busyId, setBusyId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const byCategory = new Map<string, CatalogProduct[]>()
    for (const p of products) {
      const list = byCategory.get(p.category) ?? []
      list.push(p)
      byCategory.set(p.category, list)
    }
    for (const list of byCategory.values()) {
      // Seller-curated order first, then newest among unordered
      list.sort(
        (a, b) =>
          (a.display_order ?? Number.MAX_SAFE_INTEGER) -
            (b.display_order ?? Number.MAX_SAFE_INTEGER) || b.created_at.localeCompare(a.created_at)
      )
    }
    // Biggest groups first so the dominant lines of the business lead the page
    return [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [products])

  const featuredCount = products.filter((p) => p.is_featured && p.status === 'active').length
  const atFeaturedCap = featuredCount >= MAX_FEATURED

  const handleToggleFeatured = async (product: CatalogProduct) => {
    if (!product.is_featured && featuredCount >= MAX_FEATURED) {
      showSnackbar(`Máximo ${MAX_FEATURED} destacados. Quita uno para destacar otro.`, {
        variant: 'error',
      })
      return
    }

    setBusyId(product.id)
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id)
      if (error) throw error
      showSnackbar(
        product.is_featured ? 'Quitado de destacados' : 'Producto destacado en tu vitrina',
        { variant: 'success' }
      )
      onUpdate()
    } catch (err) {
      console.error('Error toggling featured:', err)
      showSnackbar('Error al actualizar el producto', { variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  /** Swap positions with the neighbor in the group; persists both display_order values. */
  const handleMove = async (category: string, index: number, direction: -1 | 1) => {
    const group = groups.find(([cat]) => cat === category)?.[1]
    if (!group) return
    const target = group[index + direction]
    const current = group[index]
    if (!target || !current) return

    const next = Math.max(group[0]?.display_order ?? 1, 1)
    const orders = group.map((p, i) => ({ id: p.id, display_order: next + i }))
    const swap = orders.find((o) => o.id === current.id)
    const swapWith = orders.find((o) => o.id === target.id)
    if (swap && swapWith) {
      const tmp = swap.display_order
      swap.display_order = swapWith.display_order
      swapWith.display_order = tmp
    }

    setBusyId(current.id)
    try {
      await Promise.all(
        orders
          .filter((o) => o.id === current.id || o.id === target.id)
          .map((o) =>
            supabase.from('products').update({ display_order: o.display_order }).eq('id', o.id)
          )
      )
      onUpdate()
    } catch (err) {
      console.error('Error reordering catalog:', err)
      showSnackbar('Error al reordenar', { variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Star className="mr-1 inline size-4 fill-primary text-primary" aria-hidden />
          Destacados: <span className="tabular-nums">{featuredCount}</span> de {MAX_FEATURED} —
          aparecen arriba en tu vitrina
          {atFeaturedCap && (
            <span className="font-medium"> · Máximo alcanzado — quitá uno para destacar otro</span>
          )}
        </p>
        <Button asChild variant="outline" size="sm" className="min-h-[44px] sm:min-h-9">
          <Link href={`/negocio/${businessSlug}`}>
            <Eye className="mr-2 size-4" aria-hidden />
            Ver mi vitrina
          </Link>
        </Button>
      </div>

      {groups.map(([category, items]) => (
        <section key={category} aria-labelledby={`catalog-${category}`}>
          <h3
            id={`catalog-${category}`}
            className="mb-3 flex items-center gap-2 text-lg font-semibold"
          >
            <Package className="size-4 text-muted-foreground" aria-hidden />
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              ({items.length})
            </span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((product, index) => {
              const categoryLabel =
                CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category
              return (
                <Card
                  key={product.id}
                  className={`group gap-0 py-0 ${product.is_featured ? 'ring-1 ring-primary' : ''}`}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {/* Position badge: makes the manual order visible without
                          visiting the storefront (display_order within category) */}
                        <span
                          className="mb-1 inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground"
                          title={`Posición ${index + 1} en ${categoryLabel}`}
                        >
                          {index + 1}
                        </span>
                        <Link
                          href={getProductPath(product.id, product.title)}
                          className="line-clamp-2 text-sm font-medium hover:underline"
                        >
                          {product.title}
                        </Link>
                        <p className="mt-1 text-base font-semibold tabular-nums">
                          Bs. {product.price.toLocaleString('es-BO')}
                        </p>
                      </div>
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={56}
                          height={56}
                          className="size-14 shrink-0 rounded-md object-cover"
                          unoptimized={shouldBypassNextImageOptimization(product.images[0])}
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted"
                        >
                          <Package className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      {product.status !== 'active' && (
                        <Badge variant="secondary" className="shrink-0">
                          {product.status === 'sold' ? 'Vendido' : 'Inactivo'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden />
                        <span className="tabular-nums">{product.views_count}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="size-3.5" aria-hidden />
                        <span className="tabular-nums">{product.contacts_count}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t pt-3">
                      <Button
                        variant={product.is_featured ? 'default' : 'outline'}
                        size="sm"
                        className="min-h-[44px] sm:min-h-9"
                        disabled={
                          busyId === product.id ||
                          product.status !== 'active' ||
                          (!product.is_featured && atFeaturedCap)
                        }
                        title={
                          !product.is_featured && atFeaturedCap
                            ? 'Máximo 4 destacados. Quita uno para destacar otro.'
                            : undefined
                        }
                        onClick={() => handleToggleFeatured(product)}
                        aria-pressed={product.is_featured}
                      >
                        <Star
                          className={`mr-1.5 size-4 ${product.is_featured ? 'fill-primary-foreground' : ''}`}
                          aria-hidden
                        />
                        {product.is_featured ? 'Destacado' : 'Destacar'}
                      </Button>

                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:size-9 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                          disabled={busyId === product.id || index === 0}
                          onClick={() => handleMove(category, index, -1)}
                          aria-label={`Subir ${product.title} en la lista`}
                          title={`Subir ${product.title} en la lista (lista ${categoryLabel})`}
                        >
                          <ChevronUp className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:size-9 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                          disabled={busyId === product.id || index === items.length - 1}
                          onClick={() => handleMove(category, index, 1)}
                          aria-label={`Bajar ${product.title} en la lista`}
                          title={`Bajar ${product.title} en la lista (lista ${categoryLabel})`}
                        >
                          <ChevronDown className="size-4" aria-hidden />
                        </Button>
                        <ProductActions
                          productId={product.id}
                          productTitle={product.title}
                          status={product.status}
                          onUpdate={onUpdate}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
