'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { Button } from '@/components/ui/button'
import { absoluteUrl, getAvatarColor } from '@/lib/utils'
import { MapPin, Calendar, Store, Share2 } from 'lucide-react'
import Link from 'next/link'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { buildWhatsAppMeUrl, normalizeBolivianWhatsAppDigits } from '@/lib/utils/whatsapp'
import { resolveAvatarUrl } from '@/lib/utils/image'
import { useSnackbar } from '@/components/ui/snackbar'

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
  social_whatsapp?: string | null
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

export function SellerProfileHeader({
  profile,
  businessSlug,
  social_whatsapp,
  productCount,
}: SellerProfileHeaderProps) {
  const { showSnackbar } = useSnackbar()

  const memberSince = new Date(profile.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  })

  const location = [profile.location_city, profile.location_department].filter(Boolean).join(', ')

  const hasRatings = (profile.rating_count ?? 0) > 0
  const ratingAvg = profile.rating_average ?? 0

  const whatsappNumber = social_whatsapp || profile.phone
  const whatsappDigits = whatsappNumber ? normalizeBolivianWhatsAppDigits(whatsappNumber) : null
  const profileUrl = absoluteUrl(`/vendedor/${profile.id}`)
  const whatsappMessage = `Hola! Vi tu perfil "${profile.full_name || 'vendedor'}" en Telopillo y me gustaría hacerte una consulta.\n\nVer perfil: ${profileUrl}`
  const whatsappHref = whatsappDigits ? buildWhatsAppMeUrl(whatsappDigits, whatsappMessage) : null

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: profile.full_name || 'Vendedor en Telopillo',
          text: `Mira el perfil de ${profile.full_name || 'este vendedor'} en Telopillo`,
          url: profileUrl,
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl)
        showSnackbar('Enlace copiado al portapapeles', { variant: 'success' })
      } catch (err) {
        console.error('Clipboard failed:', err)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <Avatar className="size-24 border">
          <AvatarImage
            src={resolveAvatarUrl(profile.avatar_url) || undefined}
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
        {whatsappHref && (
          <ProductWhatsAppLink
            href={whatsappHref}
            ariaLabel={`Contactar a ${profile.full_name || 'vendedor'} por WhatsApp`}
            fullWidth={false}
            className="min-h-[44px] w-full sm:w-auto sm:min-w-[12rem]"
          />
        )}

        <Button
          variant="outline"
          size="lg"
          className="min-h-[44px] w-full sm:w-auto gap-2"
          onClick={handleShare}
        >
          <Share2 className="size-5" aria-hidden />
          Compartir perfil
        </Button>

        {businessSlug && (
          <Button asChild variant="outline" size="lg" className="min-h-[44px] w-full sm:w-auto">
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
