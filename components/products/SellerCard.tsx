import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { getAvatarColor } from '@/lib/utils'
import { MapPin, Store, User } from 'lucide-react'

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  location_city: string | null
  location_department: string | null
  phone: string | null
  verification_level?: number
}

interface BusinessInfo {
  business_name: string
  slug: string
}

interface SellerCardProps {
  seller: SellerProfile
  productTitle: string
  business?: BusinessInfo | null
}

export function SellerCard({ seller, productTitle, business }: SellerCardProps) {
  // Get seller initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate WhatsApp link with pre-filled message
  const getWhatsAppLink = (): string => {
    const message = encodeURIComponent(`Hola! Estoy interesado en tu producto: ${productTitle}`)

    // If seller has phone, use it (Bolivia country code: 591)
    if (seller.phone) {
      // Remove any non-digit characters and ensure it starts with country code
      const cleanPhone = seller.phone.replace(/\D/g, '')
      const phoneWithCountry = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`
      return `https://wa.me/${phoneWithCountry}?text=${message}`
    }

    // Fallback: WhatsApp with message only (user can select contact)
    return `https://wa.me/?text=${message}`
  }

  const hasPhone = !!seller.phone

  const location =
    seller.location_city && seller.location_department
      ? `${seller.location_city}, ${seller.location_department}`
      : seller.location_department || seller.location_city || 'Ubicación no especificada'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vendedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={seller.avatar_url || undefined} alt={seller.full_name || 'Usuario'} />
            <AvatarFallback className={`text-lg font-medium ${getAvatarColor(seller.id)}`}>
              {getInitials(seller.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold text-lg truncate">{seller.full_name || 'Usuario'}</p>
            {seller.verification_level !== undefined && (
              <VerificationBadge
                hasBusinessProfile={!!business}
                verificationLevel={seller.verification_level}
                size="sm"
              />
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Business Info */}
        {business && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Store className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{business.business_name}</p>
            </div>
            <Link
              href={`/negocio/${business.slug}`}
              className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
            >
              Visitar tienda
            </Link>
          </div>
        )}

        {/* Contact Button */}
        {hasPhone ? (
          <Button
            asChild
            className="w-full min-h-[44px] bg-green-700 hover:bg-green-800 text-white"
            size="lg"
          >
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
              aria-label={`Contactar a ${seller.full_name || 'vendedor'} por WhatsApp sobre ${productTitle}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                El vendedor aún no ha agregado un número de contacto.
              </p>
            </div>
            {/* Make "Ver perfil" the primary CTA when no phone */}
            <Button asChild className="w-full min-h-[44px]" size="lg">
              <Link
                href={`/vendedor/${seller.id}`}
                className="flex items-center justify-center gap-2"
              >
                <User className="h-5 w-5" aria-hidden />
                Ver perfil del vendedor
              </Link>
            </Button>
          </div>
        )}

        {/* View Seller Profile Link (secondary when phone available) */}
        {hasPhone && (
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link
              href={`/vendedor/${seller.id}`}
              className="flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" aria-hidden />
              Ver perfil del vendedor
            </Link>
          </Button>
        )}

        {/* Safety Tips */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            <span aria-hidden="true">💡</span> Consejos de seguridad:
          </p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Reúnete en lugares públicos</li>
            <li>Verifica el producto antes de pagar</li>
            <li>No compartas información personal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
