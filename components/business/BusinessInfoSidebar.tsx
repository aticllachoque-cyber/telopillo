'use client'

import { Clock, MapPin, Phone, Globe, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Day names in Spanish, keyed by lowercase abbreviation
const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes',
  mar: 'Martes',
  mie: 'Miércoles',
  jue: 'Jueves',
  vie: 'Viernes',
  sab: 'Sábado',
  dom: 'Domingo',
}

const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

function getTodayKey(): string {
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon...
  const map: string[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
  return map[jsDay] ?? 'lun'
}

interface BusinessInfoSidebarProps {
  business: {
    business_hours: Record<string, string> | null
    business_address: string | null
    business_department: string | null
    business_city: string | null
    website_url: string | null
    social_facebook: string | null
    social_instagram: string | null
    social_tiktok: string | null
    social_whatsapp: string | null
  }
  phone: string | null
}

export function BusinessInfoSidebar({ business, phone }: BusinessInfoSidebarProps) {
  const todayKey = getTodayKey()
  const hours = business.business_hours as Record<string, string> | null

  const location = [business.business_city, business.business_department].filter(Boolean).join(', ')

  // Check if open right now (simple check - just if today has hours)
  const todayHours = hours?.[todayKey]
  const isOpenToday = !!todayHours && todayHours !== 'closed'

  // Normalize a Bolivian phone number to include the country code
  function normalizeBolivianPhone(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits.startsWith('591')) return digits
    return `591${digits}`
  }

  // Build WhatsApp link
  const whatsappNumber = business.social_whatsapp || phone
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${normalizeBolivianPhone(whatsappNumber)}`
    : null

  // Build tel: link with country code
  const telLink = phone ? `tel:+${normalizeBolivianPhone(phone)}` : null

  const hasSocialLinks =
    business.social_facebook || business.social_instagram || business.social_tiktok

  const hasContactInfo = phone || whatsappLink || business.website_url || hasSocialLinks
  const hasHours = hours && Object.keys(hours).length > 0
  const hasLocation = location || business.business_address

  // Return nothing when sidebar has no meaningful content
  if (!hasContactInfo && !hasHours && !hasLocation) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* WhatsApp CTA - most important for Bolivian market */}
      {whatsappLink && (
        <Button
          asChild
          className="w-full min-h-[44px] bg-green-700 hover:bg-green-800 text-white"
          size="lg"
        >
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <svg className="size-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contactar por WhatsApp
          </a>
        </Button>
      )}

      {/* Phone */}
      {phone && telLink && (
        <Button asChild variant="outline" className="w-full min-h-[44px]" size="lg">
          <a href={telLink} aria-label={`Llamar al ${phone}`}>
            <Phone className="size-4 mr-2" aria-hidden="true" />
            {phone}
          </a>
        </Button>
      )}

      {/* Business Hours */}
      {hasHours && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4" aria-hidden="true" />
              Horario de Atención
              {isOpenToday ? (
                <span
                  role="status"
                  className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                >
                  <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
                  Abierto
                </span>
              ) : (
                <span
                  role="status"
                  className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                >
                  <span className="size-1.5 rounded-full bg-red-500" aria-hidden="true" />
                  Cerrado
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5 text-sm" aria-label="Horarios de atención">
              {DAY_ORDER.map((day) => {
                const dayHours = hours?.[day]
                const isToday = day === todayKey

                return (
                  <li
                    key={day}
                    className={`flex justify-between ${
                      isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    }`}
                    aria-current={isToday ? 'date' : undefined}
                  >
                    <span>{DAY_LABELS[day]}</span>
                    <span>{dayHours && dayHours !== 'closed' ? dayHours : 'Cerrado'}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {hasLocation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1 text-sm text-muted-foreground">
            {location && <p>{location}</p>}
            {business.business_address && <p>{business.business_address}</p>}
          </CardContent>
        </Card>
      )}

      {/* Contact & Social Links — only show when actual links exist */}
      {(business.website_url || hasSocialLinks) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4" aria-hidden="true" />
              Enlaces
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {business.website_url && (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar sitio web del negocio"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="size-3.5" aria-hidden="true" />
                Sitio Web
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
            {business.social_facebook && (
              <a
                href={business.social_facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar Facebook del negocio"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            )}
            {business.social_instagram && (
              <a
                href={
                  business.social_instagram.startsWith('http')
                    ? business.social_instagram
                    : `https://instagram.com/${business.social_instagram.replace('@', '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar Instagram del negocio"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            )}
            {business.social_tiktok && (
              <a
                href={
                  business.social_tiktok.startsWith('http')
                    ? business.social_tiktok
                    : `https://tiktok.com/${business.social_tiktok.replace('@', '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar TikTok del negocio"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                TikTok
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
