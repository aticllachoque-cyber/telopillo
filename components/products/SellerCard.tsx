import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, MessageCircle } from 'lucide-react'

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  location_city: string | null
  location_department: string | null
  phone: string | null
}

interface SellerCardProps {
  seller: SellerProfile
  productTitle: string
}

export function SellerCard({ seller, productTitle }: SellerCardProps) {
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
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-medium">
              {getInitials(seller.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{seller.full_name || 'Usuario'}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Contact Button */}
        {hasPhone ? (
          <Button asChild className="w-full" size="lg">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
              aria-label={`Contactar a ${seller.full_name || 'vendedor'} por WhatsApp sobre ${productTitle}`}
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Contactar Vendedor
            </a>
          </Button>
        ) : (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              El vendedor no ha agregado un número de teléfono
            </p>
          </div>
        )}

        {/* Safety Tips */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">💡 Consejos de seguridad:</p>
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
