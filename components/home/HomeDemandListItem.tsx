import Link from 'next/link'
import { Clock, MapPin, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DemandImageFrame } from '@/components/demand/DemandImageFrame'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import type { SearchDemandPost } from '@/types/database'

interface HomeDemandListItemProps {
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

export function HomeDemandListItem({ post }: HomeDemandListItemProps) {
  const categoryLabel =
    CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS] || post.category
  const priceRange = formatPriceRange(post.price_min, post.price_max)

  return (
    <Link
      href={`/busco/${post.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Ver solicitud: ${post.title}`}
    >
      <Card className="border border-border/60 p-4 shadow-md transition-shadow group-hover:shadow-lg group-focus-visible:shadow-lg">
        <div className="flex gap-4">
          <DemandImageFrame
            imageUrl={post.image_url}
            category={post.category}
            title={post.title}
            className="w-28 shrink-0 self-start"
            aspectClassName="aspect-square"
            sizes="112px"
            iconClassName="h-7 w-7"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <Badge variant="secondary" className="shrink-0 text-xs">
                {categoryLabel}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <Clock className="h-3 w-3 shrink-0" aria-hidden />
                {formatRelativeDate(post.created_at)}
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 text-pretty text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary sm:text-base">
              {post.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              {priceRange && (
                <span className="font-medium text-primary tabular-nums">{priceRange}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {post.location_city}, {post.location_department}
                </span>
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {post.offers_count} {post.offers_count === 1 ? 'oferta' : 'ofertas'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
