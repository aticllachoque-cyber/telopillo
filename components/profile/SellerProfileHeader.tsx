import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { Button } from '@/components/ui/button'
import { getAvatarColor } from '@/lib/utils'
import { MapPin, Calendar, Store } from 'lucide-react'
import Link from 'next/link'

interface SellerProfileHeaderProps {
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    location_city: string | null
    location_department: string | null
    phone: string | null
    verification_level: number
    rating_average: number | null
    rating_count: number | null
    created_at: string
  }
  businessSlug: string | null
  productCount: number
}

function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getWhatsAppLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const phoneWithCountry = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`
  return `https://wa.me/${phoneWithCountry}`
}

export function SellerProfileHeader({
  profile,
  businessSlug,
  productCount,
}: SellerProfileHeaderProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  })

  const location = [profile.location_city, profile.location_department].filter(Boolean).join(', ')

  const hasRatings = (profile.rating_count ?? 0) > 0
  const ratingAvg = profile.rating_average ?? 0

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <Avatar className="size-24 border">
          <AvatarImage
            src={profile.avatar_url || undefined}
            alt={profile.full_name || 'Vendedor'}
          />
          <AvatarFallback className={`text-2xl font-bold ${getAvatarColor(profile.id)}`}>
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              {profile.full_name || 'Vendedor'}
            </h1>
            <VerificationBadge
              hasBusinessProfile={!!businessSlug}
              verificationLevel={profile.verification_level}
              size="sm"
            />
          </div>

          {/* Rating — only show when there are actual reviews */}
          {hasRatings && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1" aria-label={`${ratingAvg} de 5 estrellas`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`size-4 ${i < Math.round(ratingAvg) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30 fill-muted-foreground/30'}`}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {ratingAvg.toFixed(1)} ({profile.rating_count}{' '}
                {profile.rating_count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          )}

          {/* Meta info */}
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
            <span className="text-sm">
              {productCount} {productCount === 1 ? 'producto' : 'productos'} publicados
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {profile.phone && (
          <Button asChild size="lg" className="bg-green-700 hover:bg-green-800 text-white">
            <a
              href={getWhatsAppLink(profile.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
              aria-label={`Contactar a ${profile.full_name || 'vendedor'} por WhatsApp`}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </Button>
        )}

        {businessSlug && (
          <Button asChild variant="outline" size="lg">
            <Link href={`/negocio/${businessSlug}`} className="flex items-center gap-2">
              <Store className="size-5" aria-hidden />
              Visitar tienda
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
