'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, MapPin, Package, Store, User } from 'lucide-react'
import { ProductActions } from './ProductActions'
import { formatProductLocationDisplay } from '@/lib/validations/product'

interface ProductCardProps {
  product: {
    id: string
    user_id?: string
    title: string
    price: number
    images: string[]
    status: string
    location_city: string
    location_department: string
    views_count: number
    created_at: string
    // Seller info (optional — available when coming from search API)
    seller_name?: string | null
    seller_business_name?: string | null
    seller_business_slug?: string | null
    seller_verification_level?: number
  }
  onUpdate?: () => void
  showActions?: boolean
  /** Mark the product image as LCP priority (use for the first visible card) */
  priority?: boolean
  /** Show or hide the status badge (hide on public-facing pages) */
  showStatusBadge?: boolean
}

export function ProductCard({
  product,
  onUpdate,
  showActions = true,
  priority = false,
  showStatusBadge = true,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const statusConfig = {
    active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-500' },
    sold: { label: 'Vendido', variant: 'secondary' as const, color: 'bg-blue-500' },
    inactive: { label: 'Inactivo', variant: 'outline' as const, color: 'bg-gray-500' },
    deleted: { label: 'Eliminado', variant: 'destructive' as const, color: 'bg-red-500' },
  }

  const status = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.active
  const imageUrl = !imageError && product.images[0] ? product.images[0] : null
  const location = formatProductLocationDisplay(product.location_city, product.location_department)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group focus-within:shadow-lg">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link
          href={`/productos/${product.id}`}
          className="block absolute inset-0"
          aria-label={`Ver ${product.title}`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              role="img"
              aria-label={product.title}
            >
              <Package className="size-12 text-muted-foreground/50" aria-hidden />
            </div>
          )}
        </Link>

        {/* Status Badge */}
        {showStatusBadge && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <Badge variant={status.variant} className="shadow-md">
              {status.label}
            </Badge>
          </div>
        )}

        {/* Quick Actions Menu — outside the Link to avoid nested interactive elements */}
        {showActions && (
          <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
            <ProductActions
              productId={product.id}
              productTitle={product.title}
              status={product.status}
              onUpdate={onUpdate}
              variant="dropdown"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <Link href={`/productos/${product.id}`} className="block space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <p className="text-2xl font-bold text-primary">
            Bs {product.price.toLocaleString('es-BO')}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </div>
        </Link>

        {/* Seller Info — hidden in owner view (showActions=true) */}
        {!showActions && (product.seller_business_name || product.seller_name) && (
          <div className="mt-2 pt-2 border-t">
            {product.seller_business_slug && product.seller_business_name ? (
              <Link
                href={`/negocio/${product.seller_business_slug}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                title={`Ver tienda: ${product.seller_business_name}`}
              >
                <Store className="h-3 w-3 flex-shrink-0 text-primary/70" aria-hidden />
                <span className="truncate font-medium">{product.seller_business_name}</span>
              </Link>
            ) : product.seller_name && product.user_id ? (
              <Link
                href={`/vendedor/${product.user_id}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title={`Ver perfil de ${product.seller_name}`}
              >
                <User className="h-3 w-3 flex-shrink-0" aria-hidden />
                <span className="truncate">{product.seller_name}</span>
              </Link>
            ) : product.seller_name ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3 flex-shrink-0" aria-hidden />
                <span className="truncate">{product.seller_name}</span>
              </span>
            ) : null}
          </div>
        )}
      </CardContent>

      {/* Footer - Stats */}
      <CardFooter className="p-4 pt-0 flex items-center gap-4 text-sm text-muted-foreground">
        {product.views_count > 0 && (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" aria-hidden />
            <span aria-label={`${product.views_count} vistas`}>{product.views_count}</span>
          </div>
        )}
        <span
          className="text-xs"
          aria-label={`Publicado el ${new Date(product.created_at).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        >
          {new Date(product.created_at).toLocaleDateString('es-BO', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </CardFooter>
    </Card>
  )
}
