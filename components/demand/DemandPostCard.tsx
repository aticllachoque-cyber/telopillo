import Link from 'next/link'
import { MapPin, MessageSquare, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import type { SearchDemandPost } from '@/types/database'

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
  const snippet =
    post.description.length > 120
      ? post.description.slice(0, 120).trimEnd() + '...'
      : post.description

  return (
    <Link
      href={`/busco/${post.id}`}
      className="block group"
      aria-label={`Ver solicitud: ${post.title}`}
    >
      <Card className="p-4 h-full transition-shadow hover:shadow-md gap-3 flex flex-col">
        {/* Category badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs shrink-0">
            {categoryLabel}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {formatRelativeDate(post.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-tight group-hover:text-primary line-clamp-2 text-balance">
          {post.title}
        </h3>

        {/* Description snippet */}
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 text-pretty">{snippet}</p>

        {/* Price range */}
        {priceRange && <p className="text-sm font-medium text-primary">{priceRange}</p>}

        {/* Footer: location + offers */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {post.location_city}, {post.location_department}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" aria-hidden />
            {post.offers_count} {post.offers_count === 1 ? 'oferta' : 'ofertas'}
          </span>
        </div>
      </Card>
    </Link>
  )
}
