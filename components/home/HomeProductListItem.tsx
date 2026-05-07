import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { HomepagePreviewProduct } from '@/lib/home/getHomepagePreview'
import { formatProductLocationDisplay } from '@/lib/validations/product'

interface HomeProductListItemProps {
  product: HomepagePreviewProduct
  priority?: boolean
}

export function HomeProductListItem({ product, priority = false }: HomeProductListItemProps) {
  const imageUrl = product.images[0] || null
  const location = formatProductLocationDisplay(product.location_city, product.location_department)

  return (
    <Link
      href={`/productos/${product.id}`}
      className="block group"
      aria-label={`Ver ${product.title}`}
    >
      <Card className="overflow-hidden border border-border/60 shadow-md transition-shadow hover:shadow-lg">
        <div className="flex items-stretch gap-0">
          <div className="relative w-28 shrink-0 overflow-hidden bg-muted sm:w-32">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 112px, 128px"
                priority={priority}
              />
            ) : (
              <div className="flex h-full min-h-28 items-center justify-center">
                <Package className="size-8 text-muted-foreground/50" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 px-4 py-3">
            <h3 className="line-clamp-2 text-pretty text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
              {product.title}
            </h3>
            <p className="mt-2 text-xl font-bold leading-tight text-primary tabular-nums">
              Bs {product.price.toLocaleString('es-BO')}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
