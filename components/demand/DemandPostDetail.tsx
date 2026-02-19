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
import { getCategoryName } from '@/lib/data/categories'
import { MapPin, MessageSquare, Calendar, Clock, CheckCircle2, Phone, Loader2 } from 'lucide-react'

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
    full_name: string
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
    return `Bs. ${min.toLocaleString('es-BO')} - Bs. ${max.toLocaleString('es-BO')}`
  if (min != null) return `Desde Bs. ${min.toLocaleString('es-BO')}`
  return `Hasta Bs. ${max!.toLocaleString('es-BO')}`
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

  const whatsappMessage = `Hola! Vi tu solicitud "${post.title}" en Telopillo.bo. Tengo algo que podría interesarte.`
  const whatsappUrl = poster?.phone
    ? `https://wa.me/${poster.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : null

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
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DemandStatusBadge status={displayStatus} />
            <Badge variant="secondary">{categoryName || post.category}</Badge>
            {post.subcategory && <Badge variant="outline">{post.subcategory}</Badge>}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl text-balance">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden />
              {post.location_city}, {post.location_department}
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

        <Separator />

        {/* Description */}
        <div>
          <h2 className="font-semibold mb-2 text-balance">Descripción</h2>
          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-pretty">
            {post.description}
          </p>
        </div>

        {/* Price range */}
        {priceRange && (
          <div>
            <h2 className="font-semibold mb-2 text-balance">Presupuesto</h2>
            <p className="text-lg font-medium text-primary">{priceRange}</p>
          </div>
        )}

        {/* Owner actions */}
        {isOwner && isActive && (
          <div className="flex flex-wrap gap-3">
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
              Marcar como Encontrado
            </Button>
          </div>
        )}

        <Separator />

        {/* Offers section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2 text-balance">
              <MessageSquare className="h-5 w-5" aria-hidden />
              Ofertas ({offers.length})
            </h2>
            {canOffer && (
              <Button onClick={() => setShowOfferModal(true)} className="min-h-[44px]">
                Ofrecer mi producto
              </Button>
            )}
          </div>

          {offers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-pretty">
                  {isActive
                    ? 'Aún no hay ofertas. ¡Sé el primero en ofrecer!'
                    : 'No se recibieron ofertas.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Buyer info */}
        {poster && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={poster.avatar_url || undefined} alt={poster.full_name} />
                  <AvatarFallback>
                    {poster.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{poster.full_name}</p>
                  {posterBusiness && (
                    <Link
                      href={`/tienda/${posterBusiness.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {posterBusiness.business_name}
                    </Link>
                  )}
                </div>
              </div>

              {whatsappUrl && !isOwner && (
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-2 h-4 w-4" aria-hidden />
                    Contactar por WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTA for non-logged-in users */}
        {!currentUserId && isActive && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3 text-pretty">
                ¿Tienes lo que esta persona busca?
              </p>
              <Button asChild className="w-full min-h-[44px]">
                <Link href={`/login?redirect=/busco/${post.id}`}>Inicia sesión para ofrecer</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Offer modal */}
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

  const imageUrl = product.images?.[0]

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
              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                Bs. {product.price.toLocaleString('es-BO')}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={seller.avatar_url || undefined} alt={seller.full_name} />
                <AvatarFallback className="text-[10px]">
                  {seller.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{seller.full_name}</span>
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
