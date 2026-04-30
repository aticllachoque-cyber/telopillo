'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, MapPin, Package, Store, User } from 'lucide-react'
import { ProductActions } from './ProductActions'
import { formatProductLocationDisplay } from '@/lib/validations/product'
import { absoluteUrl } from '@/lib/utils'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  normalizeBolivianWhatsAppDigits,
} from '@/lib/utils/whatsapp'

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
  /** Public shared-profile / storefront only: seller WhatsApp for this grid */
  whatsappContactPhone?: string | null
}

export function ProductCard({
  product,
  onUpdate,
  showActions = false,
  priority = false,
  showStatusBadge = true,
  whatsappContactPhone = null,
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

  const whatsappDigits =
    !showActions && whatsappContactPhone
      ? normalizeBolivianWhatsAppDigits(whatsappContactPhone)
      : null
  const whatsappHref =
    whatsappDigits != null
      ? buildWhatsAppMeUrl(
          whatsappDigits,
          buildProductWhatsAppPrefillMessage({
            productTitle: product.title,
            price: product.price,
            productAbsoluteUrl: absoluteUrl(`/productos/${product.id}`),
          })
        )
      : null

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

      {/* Footer — optional WhatsApp (shared seller / storefront pages only) */}
      <CardFooter className="flex flex-col gap-3 p-4 pt-0">
        {whatsappHref && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full min-h-[44px] shrink-0 border-green-700/80 bg-green-50 text-green-900 hover:bg-green-100 hover:text-green-950 dark:border-green-600 dark:bg-green-950/40 dark:text-green-50 dark:hover:bg-green-900/50"
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp sobre este producto"
            >
              <svg
                className="mr-2 size-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </Button>
        )}
        <div className="flex w-full items-center gap-4 text-sm text-muted-foreground">
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
        </div>
      </CardFooter>
    </Card>
  )
}
