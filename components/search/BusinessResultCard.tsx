'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface BusinessResultCardProps {
  business: SearchBusiness
}

/** Row card for a business in unified search results. Links to its storefront. */
export function BusinessResultCard({ business }: BusinessResultCardProps) {
  const logoSrc = resolveAvatarUrl(business.business_logo_url) ?? undefined

  return (
    <li>
      <Link
        href={`/negocio/${business.slug}`}
        className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Ver negocio ${business.business_name}`}
      >
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={logoSrc} alt={business.business_name} />
          <AvatarFallback className={`text-base font-semibold ${getAvatarColor(business.id)}`}>
            {getInitials(business.business_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{business.business_name}</p>
            {business.is_nit_verified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Verificado
              </span>
            )}
          </div>

          <p className="truncate text-sm text-muted-foreground">
            {[business.business_category || null, location(business)].filter(Boolean).join(' · ')}
          </p>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="size-3.5 shrink-0" aria-hidden />
            {business.active_listings_count} producto
            {business.active_listings_count !== 1 ? 's' : ''} activo
            {business.active_listings_count !== 1 ? 's' : ''}
            {business.owner_name && (
              <span className="truncate"> · Vendedor: {business.owner_name}</span>
            )}
          </p>
        </div>

        <span className="shrink-0 text-muted-foreground" aria-hidden>
          ›
        </span>
      </Link>
    </li>
  )
}
