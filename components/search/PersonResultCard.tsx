'use client'

import Link from 'next/link'
import { MapPin, Package, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface PersonResultCardProps {
  person: SearchPerson
}

/** Row card for a public seller profile in unified search results (no phone). */
export function PersonResultCard({ person }: PersonResultCardProps) {
  const avatarSrc = resolveAvatarUrl(person.avatar_url) ?? undefined
  const name = person.full_name || 'Usuario'
  const href = profileHref(person)

  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Ver perfil de ${name}`}
      >
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback className={`text-base font-medium ${getAvatarColor(person.id)}`}>
            {getInitials(person.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{name}</p>
            {person.verification_level >= 1 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Verificado
              </span>
            )}
          </div>

          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {locationText(person)}
            {person.rating_count > 0 && person.rating_average != null && (
              <span className="inline-flex items-center gap-1">
                {' · '}
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                <span className="tabular-nums">{person.rating_average.toFixed(1)}</span>
                <span>({person.rating_count})</span>
              </span>
            )}
          </p>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="size-3.5 shrink-0" aria-hidden />
            {person.active_listings_count} producto
            {person.active_listings_count !== 1 ? 's' : ''} activo
            {person.active_listings_count !== 1 ? 's' : ''}
          </p>
        </div>

        <span className="shrink-0 text-muted-foreground" aria-hidden>
          ›
        </span>
      </Link>
    </li>
  )
}
