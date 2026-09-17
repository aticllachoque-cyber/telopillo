'use client'

import Link from 'next/link'
import { MapPin, Package, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { getAvatarColor } from '@/lib/utils'
import { resolveAvatarUrl } from '@/lib/utils/image'
import type { SearchPerson } from '@/types/database'

function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Catalog destination, same rule as SellerCard: business storefront when the
 * person has one, public seller profile otherwise.
 */
function profileHref(person: SearchPerson): string {
  return person.business_slug ? `/negocio/${person.business_slug}` : `/vendedor/${person.id}`
}

const locationText = (person: SearchPerson): string => {
  if (person.location_city && person.location_department) {
    return `${person.location_city}, ${person.location_department}`
  }
  return person.location_department || person.location_city || 'Ubicación no especificada'
}

const GRID_CARD_TILE =
  'relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted sm:aspect-[16/10]'

interface PersonResultCardProps {
  person: SearchPerson
}

/**
 * Product-card-like card for a public seller profile in unified search
 * results (no phone, TELO-003) — same chrome as BusinessResultCard without
 * the description/category emphasis (buscar-business-card redesign).
 */
export function PersonResultCard({ person }: PersonResultCardProps) {
  const avatarSrc = resolveAvatarUrl(person.avatar_url) ?? undefined
  const name = person.full_name || 'Usuario'
  const href = profileHref(person)

  return (
    <li>
      <div className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-lg focus-within:shadow-lg">
        {/* Identity tile */}
        <div className={GRID_CARD_TILE}>
          <Avatar className="h-20 w-20 transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24">
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback className={`text-2xl font-semibold ${getAvatarColor(person.id)}`}>
              {getInitials(person.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Whole-tile link (ProductCard overlay pattern) */}
          <Link
            href={href}
            className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Ver perfil de ${name}`}
          />

          {/* Verification chip — outside the link (focusable, axe nested-interactive) */}
          {person.verification_level >= 1 && (
            <div className="absolute left-2 top-2">
              <VerificationBadge
                hasBusinessProfile={false}
                verificationLevel={person.verification_level}
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-3 sm:p-4">
          <h3 className="truncate font-semibold text-base leading-snug transition-colors hover:text-primary sm:text-lg">
            <Link
              href={href}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {name}
            </Link>
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{locationText(person)}</span>
          </div>

          {person.rating_count > 0 && person.rating_average != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
              <span className="tabular-nums">{person.rating_average.toFixed(1)}</span>
              <span>({person.rating_count})</span>
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
            <span className="flex min-w-0 shrink-0 items-center gap-1">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              {person.active_listings_count} producto
              {person.active_listings_count !== 1 ? 's' : ''} activo
              {person.active_listings_count !== 1 ? 's' : ''}
            </span>
            <span className="shrink-0 text-amber-600 dark:text-amber-400">Vendedor</span>
          </div>
        </div>
      </div>
    </li>
  )
}
