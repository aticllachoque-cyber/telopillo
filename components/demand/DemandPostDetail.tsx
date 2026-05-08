'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DemandStatusBadge, getDemandDisplayStatus } from './DemandStatusBadge'
import { OfferProductModal } from './OfferProductModal'
import { DemandImageFrame } from './DemandImageFrame'
import { getCategoryName } from '@/lib/data/categories'
import { productPresentation } from '@/lib/constants/productPresentation'
import {
  resolveAvatarUrl,
  resolveProductImageUrl,
  shouldBypassNextImageOptimization,
} from '@/lib/utils/image'
import { isPlaceholderDescription } from '@/lib/utils/demand'
import { buildWhatsAppMeUrlWithFallback } from '@/lib/utils/whatsapp'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { cn } from '@/lib/utils'
import { MapPin, MessageSquare, Calendar, Clock, CheckCircle2, Loader2, User } from 'lucide-react'

interface DemandPostDetailProps {
  post: {
    id: string
    user_id: string
    title: string
    description: string
    category: string
    subcategory: string | null
    location_department: string
    location_city: string
    price_min: number | null
    price_max: number | null
    image_url: string | null
    status: string
    offers_count: number
    expires_at: string
    created_at: string
  }
  poster: {
    id: string
    full_name: string
    avatar_url: string | null
    phone: string | null
    verification_level: number
  } | null
  posterBusiness: {
    business_name: string
    slug: string
  } | null
  offers: OfferRow[]
  currentUserId: string | null
}

interface OfferRow {
  id: string
  message: string | null
  created_at: string
  product_id: string
  seller_id: string
  products: {
    id: string
    title: string
    price: number
    images: string[]
    status: string
    location_city: string
    location_department: string
  } | null
  seller: {
    id: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    verification_level: number
  } | null
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null)
    return `Bs ${min.toLocaleString('es-BO')} - Bs ${max.toLocaleString('es-BO')}`
  if (min != null) return `Desde Bs ${min.toLocaleString('es-BO')}`
  return `Hasta Bs ${max!.toLocaleString('es-BO')}`
}

function daysUntilExpiry(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export function DemandPostDetail({
  post,
  poster,
  posterBusiness,
  offers,
  currentUserId,
}: DemandPostDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isMarkingFound, setIsMarkingFound] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)

  const displayStatus = getDemandDisplayStatus(post.status, post.expires_at)
  const isOwner = currentUserId === post.user_id
  const isActive = displayStatus === 'active'
  const canOffer = currentUserId && !isOwner && isActive
  const categoryName = getCategoryName(post.category)
  const priceRange = formatPriceRange(post.price_min, post.price_max)
  const expiryDays = daysUntilExpiry(post.expires_at)
  const location = `${post.location_city}, ${post.location_department}`

  const whatsappMessage = `Hola! Vi tu solicitud "${post.title}" en Telopillo. Tengo algo que podría interesarte.`
  const whatsappHref = buildWhatsAppMeUrlWithFallback(poster?.phone, whatsappMessage)

  const handleMarkFound = async () => {
    setIsMarkingFound(true)
    try {
      const { error } = await supabase
        .from('demand_posts')
        .update({ status: 'found' })
        .eq('id', post.id)
        .eq('user_id', currentUserId!)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error marking as found:', err)
    } finally {
      setIsMarkingFound(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DemandStatusBadge status={displayStatus} />
            <Badge variant="secondary">{categoryName || post.category}</Badge>
            {post.subcategory && <Badge variant="outline">{post.subcategory}</Badge>}
          </div>

          <h1 className={productPresentation.detailTitle}>{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden />
              {location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden />
              {formatDate(post.created_at)}
            </span>
            {isActive && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden />
                {expiryDays} {expiryDays === 1 ? 'día' : 'días'} restantes
              </span>
            )}
          </div>
        </div>

        <DemandImageFrame
          imageUrl={post.image_url}
          category={post.category}
          title={post.title}
          aspectClassName="aspect-[16/9] sm:aspect-[2/1]"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />

        <Card className="border-border/80 shadow-sm">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3" aria-label="Resumen">
              <div className={productPresentation.metaRow}>
                <MapPin className={productPresentation.metaIcon} aria-hidden />
                <span className="min-w-0">
                  <span className={productPresentation.metaLabel}>Ubicación · </span>
                  <span className="font-medium">{location}</span>
                </span>
              </div>
              <div className={productPresentation.metaRow}>
                <Calendar className={productPresentation.metaIcon} aria-hidden />
                <span className="min-w-0">
                  <span className={productPresentation.metaLabel}>Publicado · </span>
                  <span className="font-medium">{formatDate(post.created_at)}</span>
                </span>
              </div>
              {isActive && (
                <div className={productPresentation.metaRow}>
                  <Clock className={productPresentation.metaIcon} aria-hidden />
                  <span className="min-w-0">
                    <span className={productPresentation.metaLabel}>Vigencia · </span>
                    <span className="font-medium">
                      {expiryDays} {expiryDays === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </span>
                </div>
              )}
              {priceRange && (
                <div className={productPresentation.metaRow}>
                  <MessageSquare className={productPresentation.metaIcon} aria-hidden />
                  <span className="min-w-0">
                    <span className={productPresentation.metaLabel}>Presupuesto · </span>
                    <span className="font-medium">{priceRange}</span>
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className={productPresentation.sectionHeading}>Descripción</h2>
              {isPlaceholderDescription(post.description) ? (
                <p className="mt-2 text-muted-foreground italic text-pretty">
                  El comprador no agregó más detalles. Puedes contactarlo directamente para pedir
                  más contexto.
                </p>
              ) : (
                <p className={cn(productPresentation.sectionBody, 'mt-2')}>{post.description}</p>
              )}
            </div>

            {isOwner && isActive && (
              <>
                <Separator />
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href={`/busco/${post.id}/editar`}>Editar solicitud</Link>
                  </Button>
                  <Button
                    onClick={handleMarkFound}
                    disabled={isMarkingFound}
                    variant="outline"
                    className="min-h-[44px]"
                  >
                    {isMarkingFound ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                    )}
                    Marcar como encontrado
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-balance">
                <MessageSquare className="h-5 w-5" aria-hidden />
                Ofertas ({offers.length})
              </h2>
              {canOffer && (
                <Button onClick={() => setShowOfferModal(true)} className="min-h-[44px] shrink-0">
                  Ofrecer producto
                </Button>
              )}
            </div>

            {offers.length === 0 ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-8 text-center">
                <p className="text-muted-foreground text-pretty">
                  {isActive
                    ? 'Aún no hay ofertas. Sé el primero en proponer un producto.'
                    : 'No se recibieron ofertas para esta solicitud.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {poster && (
          <Card className="border-border/80 shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold">Comprador</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta persona publicó la necesidad y recibirá las ofertas.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={resolveAvatarUrl(poster.avatar_url) || undefined}
                    alt={poster.full_name}
                  />
                  <AvatarFallback className="text-base font-medium">
                    {poster.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{poster.full_name}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{location}</span>
                  </div>
                  {posterBusiness && (
                    <Link
                      href={`/negocio/${posterBusiness.slug}`}
                      className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
                    >
                      {posterBusiness.business_name}
                    </Link>
                  )}
                </div>
              </div>

              {whatsappHref && !isOwner && (
                <ProductWhatsAppLink
                  href={whatsappHref}
                  ariaLabel={`Contactar a ${poster.full_name} por WhatsApp sobre esta solicitud`}
                />
              )}

              {!whatsappHref && !isOwner && (
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link
                    href={`/vendedor/${poster.id}`}
                    className="flex items-center justify-center gap-2"
                  >
                    <User className="h-4 w-4" aria-hidden />
                    Ver perfil público
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!currentUserId && isActive && (
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 text-center sm:p-6">
              <p className="mb-3 text-sm text-muted-foreground text-pretty">
                ¿Tienes lo que esta persona busca?
              </p>
              <Button asChild className="w-full min-h-[44px]">
                <Link href={`/login?redirect=/busco/${post.id}`}>Inicia sesión para ofrecer</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {canOffer && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden z-40">
          <Button onClick={() => setShowOfferModal(true)} className="w-full min-h-[48px]">
            Ofrecer producto
          </Button>
        </div>
      )}
      {!canOffer && whatsappHref && !isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <ProductWhatsAppLink
            href={whatsappHref}
            ariaLabel={`Contactar a ${poster?.full_name ?? 'el comprador'} por WhatsApp`}
            className="min-h-12 w-full"
          />
        </div>
      )}

      {showOfferModal && currentUserId && (
        <OfferProductModal
          demandPostId={post.id}
          currentUserId={currentUserId}
          open={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            setShowOfferModal(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function OfferCard({ offer }: { offer: OfferRow }) {
  const product = offer.products
  const seller = offer.seller

  if (!product || !seller) return null

  const imageUrl = resolveProductImageUrl(product.images?.[0])

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex gap-4">
          {imageUrl && (
            <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={shouldBypassNextImageOptimization(imageUrl)}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/productos/${product.id}`}
                className="font-medium hover:text-primary truncate"
              >
                {product.title}
              </Link>
              <span
                className={cn(productPresentation.listingPrice, 'text-base sm:text-lg shrink-0')}
              >
                Bs {product.price.toLocaleString('es-BO')}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={resolveAvatarUrl(seller.avatar_url) || undefined}
                  alt={seller.full_name ?? undefined}
                />
                <AvatarFallback className="text-[10px]">
                  {(seller.full_name ?? 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{seller.full_name ?? 'Usuario'}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {product.location_city}
              </span>
            </div>

            {offer.message && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                &ldquo;{offer.message}&rdquo;
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
