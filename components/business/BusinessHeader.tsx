'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, User, Share2 } from 'lucide-react'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { Button } from '@/components/ui/button'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { buildWhatsAppMeUrl, normalizeBolivianWhatsAppDigits } from '@/lib/utils/whatsapp'
import { resolveBusinessLogoUrl, shouldBypassNextImageOptimization } from '@/lib/utils/image'
import { useSnackbar } from '@/components/ui/snackbar'
import { absoluteUrl } from '@/lib/utils'

interface BusinessHeaderProps {
  business: {
    slug: string
    business_name: string
    business_description: string | null
    business_logo_url: string | null
    business_department: string | null
    business_city: string | null
    social_whatsapp?: string | null
  }
  profile: {
    id: string
    full_name: string | null
    phone: string | null
    verification_level: number
    created_at: string
  }
}

export function BusinessHeader({ business, profile }: BusinessHeaderProps) {
  const { showSnackbar } = useSnackbar()

  const memberSince = new Date(profile.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
  })

  const location = [business.business_city, business.business_department].filter(Boolean).join(', ')
  const businessLogoUrl = resolveBusinessLogoUrl(business.business_logo_url)

  const initials = business.business_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const whatsappNumber = business.social_whatsapp || profile.phone
  const whatsappDigits = whatsappNumber ? normalizeBolivianWhatsAppDigits(whatsappNumber) : null
  const businessUrl = absoluteUrl(`/negocio/${business.slug}`)
  const whatsappMessage = `Hola! Vi tu tienda "${business.business_name}" en Telopillo y me gustaría hacerte una consulta.\n\nVer tienda: ${businessUrl}`
  const whatsappHref = whatsappDigits ? buildWhatsAppMeUrl(whatsappDigits, whatsappMessage) : null

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: business.business_name,
          text: `Mira la tienda de ${business.business_name} en Telopillo`,
          url: businessUrl,
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(businessUrl)
        showSnackbar('Enlace copiado al portapapeles', { variant: 'success' })
      } catch (err) {
        console.error('Clipboard failed:', err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Logo */}
        <div className="shrink-0">
          {businessLogoUrl ? (
            <Image
              src={businessLogoUrl}
              alt={`Logo de ${business.business_name}`}
              width={96}
              height={96}
              className="size-24 rounded-xl object-cover border"
              unoptimized={shouldBypassNextImageOptimization(businessLogoUrl)}
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-2">
        {whatsappHref && (
          <ProductWhatsAppLink
            href={whatsappHref}
            ariaLabel={`Contactar a ${business.business_name} por WhatsApp`}
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
          Compartir tienda
        </Button>
      </div>
    </div>
  )
}
