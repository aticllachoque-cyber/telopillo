import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, User } from 'lucide-react'
import { VerificationBadge } from '@/components/ui/VerificationBadge'

interface BusinessHeaderProps {
  business: {
    business_name: string
    business_description: string | null
    business_logo_url: string | null
    business_department: string | null
    business_city: string | null
  }
  profile: {
    id: string
    full_name: string | null
    verification_level: number
    created_at: string
  }
}

export function BusinessHeader({ business, profile }: BusinessHeaderProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  })

  const location = [business.business_city, business.business_department].filter(Boolean).join(', ')

  const initials = business.business_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Logo */}
      <div className="shrink-0">
        {business.business_logo_url ? (
          <Image
            src={business.business_logo_url}
            alt={`Logo de ${business.business_name}`}
            width={96}
            height={96}
            className="size-24 rounded-xl object-cover border"
          />
        ) : (
          <div
            className="size-24 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{business.business_name}</h1>
          <VerificationBadge
            hasBusinessProfile={true}
            verificationLevel={profile.verification_level}
            size="sm"
          />
        </div>

        {business.business_description && (
          <p className="text-muted-foreground line-clamp-3">{business.business_description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {location}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" aria-hidden="true" />
            Miembro desde {memberSince}
          </span>
          <Link
            href={`/vendedor/${profile.id}`}
            className="inline-flex items-center gap-1 min-h-[44px] py-2 hover:text-foreground transition-colors touch-manipulation"
          >
            <User className="size-3.5" aria-hidden="true" />
            Vendedor: {profile.full_name || 'Ver perfil'}
          </Link>
        </div>
      </div>
    </div>
  )
}
