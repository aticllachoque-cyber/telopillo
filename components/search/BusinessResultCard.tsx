'use client'

import Link from 'next/link'
import { MapPin, Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { getAvatarColor } from '@/lib/utils'
import { resolveAvatarUrl } from '@/lib/utils/image'
import type { SearchBusiness } from '@/types/database'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const location = (business: SearchBusiness): string => {
  if (business.business_city && business.business_department) {
    return `${business.business_city}, ${business.business_department}`
  }
  return business.business_department || business.business_city || 'Ubicación no especificada'
}

const GRID_CARD_TILE =
  'relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted sm:aspect-[16/10]'

interface BusinessResultCardProps {
  business: SearchBusiness
}

/**
 * Product-card-like card for a business in unified search results (F-1..F-6,
 * buscar-business-card redesign). Links to its storefront via the ProductCard
 * overlay pattern so the focusable VerificationBadge never nests inside a link.
 */
export function BusinessResultCard({ business }: BusinessResultCardProps) {
  const logoSrc = resolveAvatarUrl(business.business_logo_url) ?? undefined
  const href = `/negocio/${business.slug}`
  const description = business.business_description?.trim()

  return (
    <li>
      <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-lg focus-within:shadow-lg">
        {/* Identity tile — avatar (logo or initials) fills the 16/9 area */}
        <div className={GRID_CARD_TILE}>
          <Avatar className="h-20 w-20 transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24">
            <AvatarImage src={logoSrc} alt={business.business_name} />
            <AvatarFallback className={`text-2xl font-semibold ${getAvatarColor(business.id)}`}>
              {getInitials(business.business_name)}
            </AvatarFallback>
          </Avatar>

          {/* Whole-tile link (ProductCard overlay pattern) */}
          <Link
            href={href}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Ver negocio ${business.business_name}`}
          />

          {/* Verification chip — outside the link (focusable, axe nested-interactive) */}
          {business.is_nit_verified && (
            <div className="absolute left-2 top-2">
              {/* NIT-verified businesses get the positive business badge ("Negocio con Teléfono") */}
              <VerificationBadge hasBusinessProfile verificationLevel={1} size="sm" />
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-3 sm:p-4">
          <h3 className="truncate font-semibold text-base leading-snug transition-colors hover:text-primary sm:text-lg">
            <Link
              href={href}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {business.business_name}
            </Link>
          </h3>

          {business.business_category && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {business.business_category}
            </p>
          )}

          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{location(business)}</span>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 shrink-0 items-center gap-1">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              {business.active_listings_count} producto
              {business.active_listings_count !== 1 ? 's' : ''} activo
              {business.active_listings_count !== 1 ? 's' : ''}
            </span>
            {business.owner_name && (
              <span className="truncate">Vendedor: {business.owner_name}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
