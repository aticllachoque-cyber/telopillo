import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { productPresentation } from '@/lib/constants/productPresentation'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { getAvatarColor } from '@/lib/utils'
import { MapPin, Package, Store, User } from 'lucide-react'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  resolveSellerWhatsAppDigits,
} from '@/lib/utils/whatsapp'
import { resolveAvatarUrl, shouldBypassNextImageOptimization } from '@/lib/utils/image'

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  location_city: string | null
  location_department: string | null
  phone: string | null
  verification_level?: number
}

interface BusinessInfo {
  business_name: string
  slug: string
  /** Preferred WhatsApp number when business profile exists */
  social_whatsapp?: string | null
}

interface ProductContactPreview {
  /** First listing image URL, or null to show placeholder */
  imageUrl: string | null
  price: number
  /** Canonical product page URL (included in WhatsApp message) */
  productPageUrl: string
}

interface SellerCardProps {
  seller: SellerProfile
  productTitle: string
  business?: BusinessInfo | null
  /** Summary shown above contact actions; also used to build the WhatsApp message */
  productContact?: ProductContactPreview | null
  /** When true, hides preview and WhatsApp (e.g. product owner viewing own listing) */
  hideContactActions?: boolean
}

export function SellerCard({
  seller,
  productTitle,
  business,
  productContact,
  hideContactActions = false,
}: SellerCardProps) {
  const sellerContact = resolveSellerWhatsAppDigits(business?.social_whatsapp, seller.phone)
  const contactDigits = sellerContact.normalizedDigits
  const canWhatsApp = contactDigits != null

  // Get seller initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate WhatsApp link with pre-filled message
  const getWhatsAppLink = (): string => {
    const body =
      productContact != null
        ? buildProductWhatsAppPrefillMessage({
            productTitle,
            price: productContact.price,
            productAbsoluteUrl: productContact.productPageUrl,
          })
        : `Hola! Estoy interesado en tu producto: ${productTitle}`

    return buildWhatsAppMeUrl(contactDigits, body)
  }

  const location =
    seller.location_city && seller.location_department
      ? `${seller.location_city}, ${seller.location_department}`
      : seller.location_department || seller.location_city || 'Ubicación no especificada'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vendedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={resolveAvatarUrl(seller.avatar_url) || undefined}
              alt={seller.full_name || 'Usuario'}
            />
            <AvatarFallback className={`text-lg font-medium ${getAvatarColor(seller.id)}`}>
              {getInitials(seller.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold text-lg truncate">{seller.full_name || 'Usuario'}</p>
            {seller.verification_level !== undefined && (
              <VerificationBadge
                hasBusinessProfile={!!business}
                verificationLevel={seller.verification_level}
                size="sm"
              />
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Business Info */}
        {business && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Store className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{business.business_name}</p>
            </div>
            <Link
              href={`/negocio/${business.slug}`}
              className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
            >
              Visitar tienda
            </Link>
          </div>
        )}

        {/* Product preview for buyers — ties contact action to this listing */}
        {!hideContactActions && productContact && (
          <div
            className="rounded-lg border border-border/80 bg-muted/40 p-3"
            role="region"
            aria-label="Resumen del producto para tu consulta"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">Tu consulta sobre</p>
            <div className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {productContact.imageUrl ? (
                  <Image
                    src={productContact.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized={shouldBypassNextImageOptimization(productContact.imageUrl)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" aria-hidden>
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground line-clamp-2 text-pretty">
                  {productTitle}
                </p>
                <p className={productPresentation.sellerPreviewPrice}>
                  Bs {productContact.price.toLocaleString('es-BO')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Button */}
        {!hideContactActions && canWhatsApp ? (
          <ProductWhatsAppLink
            href={getWhatsAppLink()}
            ariaLabel={`Contactar a ${seller.full_name || 'vendedor'} por WhatsApp sobre ${productTitle}`}
          />
        ) : !hideContactActions ? (
          <div className="space-y-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {sellerContact.anyRawPresent
                  ? 'El número guardado no tiene un formato válido para WhatsApp. Podés intentar desde el perfil del vendedor.'
                  : 'El vendedor no tiene un número de WhatsApp en Telopillo. Podés ver su perfil público.'}
              </p>
            </div>
            {/* Make "Ver perfil" the primary CTA when no phone */}
            <Button asChild className="w-full min-h-[44px]" size="lg">
              <Link
                href={`/vendedor/${seller.id}`}
                className="flex items-center justify-center gap-2"
              >
                <User className="h-5 w-5" aria-hidden />
                Ver perfil del vendedor
              </Link>
            </Button>
          </div>
        ) : null}

        {/* View Seller Profile Link (secondary when phone available) */}
        {!hideContactActions && canWhatsApp && (
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link
              href={`/vendedor/${seller.id}`}
              className="flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" aria-hidden />
              Ver perfil del vendedor
            </Link>
          </Button>
        )}

        {/* Owner / no-contact: still link to public seller profile */}
        {hideContactActions && (
          <Button asChild variant="outline" className="w-full min-h-[44px]" size="sm">
            <Link
              href={`/vendedor/${seller.id}`}
              className="flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" aria-hidden />
              Ver perfil público
            </Link>
          </Button>
        )}

        {/* Safety Tips */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            <span aria-hidden="true">💡</span> Consejos de seguridad:
          </p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Reúnete en lugares públicos</li>
            <li>Verifica el producto antes de pagar</li>
            <li>No compartas información personal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
