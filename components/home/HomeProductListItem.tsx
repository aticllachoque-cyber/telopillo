import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProductPrice } from '@/components/products/ProductPrice'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import type { HomepagePreviewProduct } from '@/lib/home/getHomepagePreview'
import { absoluteUrl } from '@/lib/utils'
import { formatProductLocationDisplay } from '@/lib/validations/product'
import { resolveProductImageUrl, shouldBypassNextImageOptimization } from '@/lib/utils/image'
import { getEffectiveProductPrice, resolveActivePromotion } from '@/lib/utils/promotion'
import { getProductPath } from '@/lib/utils/publicRoutes'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  resolveSellerWhatsAppDigits,
} from '@/lib/utils/whatsapp'

interface HomeProductListItemProps {
  product: HomepagePreviewProduct
  priority?: boolean
}

export function HomeProductListItem({ product, priority = false }: HomeProductListItemProps) {
  const imageUrl = resolveProductImageUrl(product.images[0])
  const location = formatProductLocationDisplay(product.location_city, product.location_department)
  const productPath = getProductPath(product.id, product.title)
  const sellerContact = resolveSellerWhatsAppDigits(
    product.seller_business_whatsapp,
    product.seller_profile_phone
  )
  const activePromo = resolveActivePromotion(product.price, {
    promo_id: product.promo_id,
    promo_name: product.promo_name,
    promo_price: product.promo_price,
  })
  const effectivePrice = getEffectiveProductPrice(product.price, product.promo_price)
  const whatsappHref =
    sellerContact.normalizedDigits != null
      ? buildWhatsAppMeUrl(
          sellerContact.normalizedDigits,
          buildProductWhatsAppPrefillMessage({
            productTitle: product.title,
            price: effectivePrice,
            productAbsoluteUrl: absoluteUrl(productPath),
            promoName: activePromo?.promoName ?? null,
            originalPrice: activePromo ? product.price : null,
          })
        )
      : null

  return (
    <Card className="overflow-hidden border border-border/60 shadow-md transition-shadow hover:shadow-lg">
      <div className="flex items-stretch gap-0">
        <Link
          href={productPath}
          className="group flex min-w-0 flex-1 items-stretch rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Ver ${product.title}`}
        >
          <div className="relative w-28 shrink-0 overflow-hidden bg-muted sm:w-32">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 112px, 128px"
                priority={priority}
                unoptimized={shouldBypassNextImageOptimization(imageUrl)}
              />
            ) : (
              <div className="flex h-full min-h-28 items-center justify-center">
                <Package className="size-8 text-muted-foreground/50" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 px-4 py-3">
            <h3 className="line-clamp-2 text-pretty text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary sm:text-base">
              {product.title}
            </h3>
            <ProductPrice
              price={product.price}
              promoPrice={product.promo_price}
              promoName={product.promo_name}
              variant="compact"
              className="mt-2"
            />
            <div className="mt-2 flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="block min-w-0 flex-1 truncate">{location}</span>
            </div>
          </div>
        </Link>
      </div>

      {whatsappHref && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-end">
            <ProductWhatsAppLink
              href={whatsappHref}
              ariaLabel={`Contactar por WhatsApp sobre ${product.title}`}
              fullWidth={false}
              size="xs"
              variant="text"
              label="WhatsApp"
              className="text-xs no-underline"
            />
          </div>
        </div>
      )}
    </Card>
  )
}
