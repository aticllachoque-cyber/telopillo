'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, MapPin, Package, Store, User } from 'lucide-react'
import { ProductActions } from './ProductActions'
import { CONDITION_LABELS, formatProductLocationDisplay } from '@/lib/validations/product'
import { formatFullDate, formatPublishedLabel } from '@/lib/utils/date'
import { absoluteUrl } from '@/lib/utils'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  resolveProductSearchContactFields,
  resolveSellerWhatsAppDigits,
} from '@/lib/utils/whatsapp'
import { productPresentation } from '@/lib/constants/productPresentation'
import { cn } from '@/lib/utils'
import { ProductWhatsAppLink } from './ProductWhatsAppLink'
import { resolveProductImageUrl, shouldBypassNextImageOptimization } from '@/lib/utils/image'
import { getProductPath } from '@/lib/utils/publicRoutes'

interface ProductCardProps {
  product: {
    id: string
    user_id?: string
    title: string
    price: number
    images: string[]
    status: string
    /** Product condition (new / used_*); shown as a badge when present */
    condition?: string
    location_city: string
    location_department: string
    views_count: number
    created_at: string
    // Seller info (optional — available when coming from search API)
    seller_name?: string | null
    seller_business_name?: string | null
    seller_business_slug?: string | null
    seller_verification_level?: number
    /** From search RPC: COALESCE(business social_whatsapp, profile phone) */
    seller_whatsapp_phone?: string | null
    seller_business_whatsapp?: string | null
    seller_profile_phone?: string | null
  }
  onUpdate?: () => void
  showActions?: boolean
  /** Mark the product image as LCP priority (use for the first visible card) */
  priority?: boolean
  /**
   * Allow the listing status badge. "Activo" is only rendered in owner view
   * (showActions) — on public pages every listing is active, so the badge would be noise.
   */
  showStatusBadge?: boolean
  /** Public shared-profile / storefront only: seller WhatsApp for this grid */
  whatsappContactPhone?: string | null
  variant?: 'default' | 'preview'
}

/** Icon + text rows of the card meta block (location, seller, views, published). */
const CARD_META_ROW = 'flex items-center gap-1.5 min-w-0'
const CARD_META_ICON = 'h-3.5 w-3.5 shrink-0'

/** Short condition labels that fit a card badge (full labels live in CONDITION_LABELS). */
const CONDITION_BADGE_LABELS: Record<keyof typeof CONDITION_LABELS, string> = {
  new: 'Nuevo',
  used_like_new: 'Como nuevo',
  used_good: 'Buen estado',
  used_fair: 'Estado regular',
}

/**
 * Card location: drop the department when the city already names it
 * ("Santa Cruz de la Sierra, Santa Cruz" -> "Santa Cruz de la Sierra") so it fits on one line.
 */
function formatCardLocation(city: string, department: string): string {
  const full = formatProductLocationDisplay(city, department)
  const trimmedCity = (city || '').trim()
  const trimmedDept = (department || '').trim()
  if (
    trimmedCity &&
    trimmedDept &&
    full === `${trimmedCity}, ${trimmedDept}` &&
    trimmedCity.toLowerCase().startsWith(trimmedDept.toLowerCase())
  ) {
    return trimmedCity
  }
  return full
}

export function ProductCard({
  product,
  onUpdate,
  showActions = false,
  priority = false,
  showStatusBadge = true,
  whatsappContactPhone = null,
  variant = 'default',
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const statusConfig = {
    active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-500' },
    sold: { label: 'Vendido', variant: 'secondary' as const, color: 'bg-blue-500' },
    inactive: { label: 'Inactivo', variant: 'outline' as const, color: 'bg-gray-500' },
    deleted: { label: 'Eliminado', variant: 'destructive' as const, color: 'bg-red-500' },
  }

  const status = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.active
  const showStatus = showStatusBadge && (showActions || product.status !== 'active')
  const conditionLabel = product.condition
    ? CONDITION_BADGE_LABELS[product.condition as keyof typeof CONDITION_BADGE_LABELS]
    : undefined
  const imageUrl = !imageError ? resolveProductImageUrl(product.images[0]) : null
  const location = formatCardLocation(product.location_city, product.location_department)
  const isPreview = variant === 'preview'
  const publishedLabel = formatPublishedLabel(product.created_at)
  const publishedFullDate = formatFullDate(product.created_at)
  const viewsLabel = `${product.views_count} ${product.views_count === 1 ? 'vista' : 'vistas'}`

  const contactResolution = whatsappContactPhone?.trim()
    ? resolveSellerWhatsAppDigits(whatsappContactPhone, null)
    : resolveProductSearchContactFields(product)
  const productPath = getProductPath(product.id, product.title)
  const whatsappDigits = !showActions ? contactResolution.normalizedDigits : null
  const whatsappHref =
    whatsappDigits != null
      ? buildWhatsAppMeUrl(
          whatsappDigits,
          buildProductWhatsAppPrefillMessage({
            productTitle: product.title,
            price: product.price,
            productAbsoluteUrl: absoluteUrl(productPath),
          })
        )
      : null

  const showContactUnavailableHint =
    !showActions &&
    !whatsappHref &&
    contactResolution.anyRawPresent &&
    contactResolution.normalizedDigits == null

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-lg focus-within:shadow-lg">
      {/* Image */}
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          isPreview
            ? 'aspect-[16/9] sm:aspect-[16/10] lg:aspect-[5/4]'
            : 'aspect-[4/3] lg:aspect-square'
        )}
      >
        <Link
          href={productPath}
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
              unoptimized={shouldBypassNextImageOptimization(imageUrl)}
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

        {/* Condition + status badges */}
        {(conditionLabel || showStatus) && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none">
            {conditionLabel && (
              <Badge
                variant="secondary"
                className="shadow-md bg-background/90 text-foreground backdrop-blur-sm"
              >
                <span className="sr-only">Estado: </span>
                {conditionLabel}
              </Badge>
            )}
            {showStatus && (
              <Badge variant={status.variant} className="shadow-md">
                {status.label}
              </Badge>
            )}
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

      {/* Content — flex-1 so every card's footer sits at the same bottom edge */}
      <CardContent
        className={cn('flex flex-1 flex-col', isPreview ? 'p-3 sm:p-3.5' : 'p-3 sm:p-4')}
      >
        <Link href={productPath} className="block space-y-1 sm:space-y-1.5">
          {/* Title — reserve two lines so the rows below line up across cards */}
          <h3
            className={cn(
              productPresentation.listingTitle,
              'min-h-[2.75em] hover:text-primary transition-colors'
            )}
          >
            {product.title}
          </h3>

          {/* Price */}
          <p className={productPresentation.listingPrice}>
            Bs {product.price.toLocaleString('es-BO')}
          </p>
        </Link>

        {/* Meta block — location, seller, views, published: one compact list, same row style */}
        <dl className="mt-2 space-y-1 text-xs text-muted-foreground sm:mt-2.5 sm:text-sm">
          <div className={CARD_META_ROW}>
            <dt className="sr-only">Ubicación</dt>
            <MapPin className={CARD_META_ICON} aria-hidden />
            <dd className="truncate">{location}</dd>
          </div>

          {!isPreview && !showActions && (product.seller_business_name || product.seller_name) && (
            <div className={CARD_META_ROW}>
              <dt className="sr-only">Vendedor</dt>
              {product.seller_business_slug && product.seller_business_name ? (
                <>
                  <Store className={cn(CARD_META_ICON, 'text-primary/70')} aria-hidden />
                  <dd className="truncate">
                    <Link
                      href={`/negocio/${product.seller_business_slug}`}
                      className="font-medium hover:text-primary transition-colors"
                      title={`Ver tienda: ${product.seller_business_name}`}
                    >
                      {product.seller_business_name}
                    </Link>
                  </dd>
                </>
              ) : (
                <>
                  <User className={CARD_META_ICON} aria-hidden />
                  <dd className="truncate">
                    {product.user_id ? (
                      <Link
                        href={`/vendedor/${product.user_id}`}
                        className="hover:text-foreground transition-colors"
                        title={`Ver perfil de ${product.seller_name}`}
                      >
                        {product.seller_name}
                      </Link>
                    ) : (
                      product.seller_name
                    )}
                  </dd>
                </>
              )}
            </div>
          )}

          {!isPreview && (
            <>
              <div className={CARD_META_ROW}>
                <dt className="sr-only">Vistas</dt>
                <Eye className={CARD_META_ICON} aria-hidden />
                <dd className="tabular-nums">{viewsLabel}</dd>
              </div>
              {publishedLabel && (
                <div className={CARD_META_ROW}>
                  <dt className="sr-only">Publicado</dt>
                  <Clock className={CARD_META_ICON} aria-hidden />
                  <dd>
                    Publicado{' '}
                    <time dateTime={product.created_at} title={publishedFullDate}>
                      {publishedLabel}
                    </time>
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      </CardContent>

      {/* Footer — full-width CTA pinned to the card bottom (WhatsApp, or the listing itself) */}
      {!showActions && (
        <CardFooter
          className={cn(
            'mt-auto flex flex-col items-stretch gap-2 pt-0',
            isPreview ? 'p-3 sm:p-3.5' : 'p-3 sm:p-4'
          )}
        >
          {showContactUnavailableHint && (
            <p className="text-xs text-muted-foreground leading-snug" role="status">
              Contacto WhatsApp no disponible (número no válido).
            </p>
          )}
          {whatsappHref ? (
            <ProductWhatsAppLink
              href={whatsappHref}
              ariaLabel={`Contactar por WhatsApp sobre ${product.title}`}
              label="Contactar por WhatsApp"
              size="sm"
            />
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full min-h-[44px]">
              <Link href={productPath} aria-label={`Ver publicación: ${product.title}`}>
                Ver publicación
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
