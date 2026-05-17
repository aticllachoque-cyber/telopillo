import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { DemandPostPageClient } from '@/components/demand/DemandPostPageClient'
import { createClient, createPublicClient, getOptionalUser } from '@/lib/supabase/server'
import { getCategoryName } from '@/lib/data/categories'
import { resolveDemandImageUrl } from '@/lib/utils/image'
import { resolveUuidFromRouteParam } from '@/lib/utils/publicRoutes'

interface DemandPageProps {
  params: Promise<{
    id: string
  }>
}

interface RawOffer {
  id: string
  message: string | null
  created_at: string
  product_id: string | null
  seller_id: string
  products:
    | {
        id: string
        title: string
        price: number
        images: string[]
        status: string
        location_city: string
        location_department: string
      }
    | {
        id: string
        title: string
        price: number
        images: string[]
        status: string
        location_city: string
        location_department: string
      }[]
    | null
  seller:
    | {
        id: string
        full_name: string | null
        avatar_url: string | null
        phone: string | null
        verification_level: number
      }
    | {
        id: string
        full_name: string | null
        avatar_url: string | null
        phone: string | null
        verification_level: number
      }[]
    | null
}

export async function generateMetadata({ params }: DemandPageProps): Promise<Metadata> {
  const { id: routeId } = await params
  const id = resolveUuidFromRouteParam(routeId)
  if (!id) {
    return { title: 'Solicitud no encontrada' }
  }
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

  const { data: post } = await supabase
    .from('demand_posts')
    .select('title, description, category, location_city, image_url')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Solicitud no encontrada' }
  }

  const categoryName = getCategoryName(post.category)
  const imageUrl = resolveDemandImageUrl(post.image_url)

  return {
    title: `${post.title} - ${post.location_city} | Telopillo`,
    description: post.description.slice(0, 160),
    openGraph: {
      title: `Solicitud: ${post.title}`,
      description: post.description.slice(0, 160),
      type: 'website',
      images: imageUrl ? [imageUrl] : undefined,
    },
    other: {
      'article:section': categoryName || post.category,
    },
  }
}

export default async function DemandPostPage({ params }: DemandPageProps) {
  const { id: routeId } = await params
  const id = resolveUuidFromRouteParam(routeId)
  if (!id) {
    notFound()
  }
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

  const { data: post, error: postError } = await supabase
    .from('demand_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (postError || !post) {
    notFound()
  }

  const { data: poster } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, verification_level')
    .eq('id', post.user_id)
    .maybeSingle()

  const { data: posterBusiness } = await supabase
    .from('business_profiles')
    .select('business_name, slug, social_whatsapp')
    .eq('id', post.user_id)
    .maybeSingle()

  const { data: rawOffers } = await supabase
    .from('demand_offers')
    .select(
      `
      id,
      message,
      created_at,
      product_id,
      seller_id,
      products:product_id (
        id, title, price, images, status, location_city, location_department
      ),
      seller:seller_id (
        id, full_name, avatar_url, phone, verification_level
      )
    `
    )
    .eq('demand_post_id', id)
    .order('created_at', { ascending: false })

  const mapped = ((rawOffers ?? []) as RawOffer[]).map((offer) => ({
    ...offer,
    products: Array.isArray(offer.products) ? (offer.products[0] ?? null) : offer.products,
    seller: Array.isArray(offer.seller) ? (offer.seller[0] ?? null) : offer.seller,
  }))

  const offers = mapped.filter(
    (offer): offer is typeof offer & { product_id: string } => offer.product_id != null
  )

  return (
    <DemandPostPageClient
      initialData={{
        post,
        poster,
        posterBusiness,
        offers,
        currentUserId: user?.id ?? null,
      }}
    />
  )
}
