import Link from 'next/link'
import { MapPin, MessageSquare, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DemandImageFrame } from '@/components/demand/DemandImageFrame'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import { isPlaceholderDescription } from '@/lib/utils/demand'
import { buildWhatsAppMeUrlWithFallback } from '@/lib/utils/whatsapp'
import type { SearchDemandPost } from '@/types/database'
import { getDemandPath } from '@/lib/utils/publicRoutes'
import { absoluteUrl } from '@/lib/utils'

interface DemandPostCardProps {
  post: SearchDemandPost
}

function formatRelativeDate(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 30) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
}

function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `Bs. ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (min != null) return `Desde Bs. ${min.toLocaleString()}`
  return `Hasta Bs. ${max!.toLocaleString()}`
}

export function DemandPostCard({ post }: DemandPostCardProps) {
  const categoryLabel =
    CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS] || post.category
  const priceRange = formatPriceRange(post.price_min, post.price_max)
  const hasRealDescription = !isPlaceholderDescription(post.description)
  const demandPath = getDemandPath(post.id)
  const whatsappHref = buildWhatsAppMeUrlWithFallback(
    post.poster_phone,
    `Hola! Vi tu solicitud "${post.title}" en Telopillo. Tengo algo que podría interesarte.\n\nVer solicitud: ${absoluteUrl(demandPath)}`
  )
  const snippet = hasRealDescription
    ? post.description.length > 120
      ? post.description.slice(0, 120).trimEnd() + '...'
      : post.description
    : null

  return (
    <Card className="flex h-full flex-col gap-3 border border-border/60 p-4 shadow-md transition-shadow hover:shadow-md">
      <Link href={demandPath} className="group block" aria-label={`Ver solicitud: ${post.title}`}>
        <DemandImageFrame
          imageUrl={post.image_url}
          category={post.category}
          title={post.title}
          className="mb-1"
          aspectClassName="aspect-[16/9]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs shrink-0">
            {categoryLabel}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {formatRelativeDate(post.created_at)}
          </span>
        </div>

        <h3 className="mt-3 font-semibold text-base leading-tight group-hover:text-primary line-clamp-2 text-balance">
          {post.title}
        </h3>

        {snippet && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1 text-pretty">
            {snippet}
          </p>
        )}

        {priceRange && (
          <p className="mt-2 text-sm font-medium text-primary tabular-nums">{priceRange}</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {post.location_city}, {post.location_department}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <MessageSquare className="h-3 w-3 shrink-0" aria-hidden />
            {post.offers_count} {post.offers_count === 1 ? 'oferta' : 'ofertas'}
          </span>
        </div>
      </Link>

      {whatsappHref && (
        <div className="mt-auto flex items-center justify-end border-t pt-2">
          <ProductWhatsAppLink
            href={whatsappHref}
            ariaLabel={`Contactar por WhatsApp sobre la solicitud ${post.title}`}
            fullWidth={false}
            size="xs"
            variant="text"
            label="WhatsApp"
            className="text-xs no-underline"
          />
        </div>
      )}
    </Card>
  )
}
