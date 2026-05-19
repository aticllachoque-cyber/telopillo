import { notFound, permanentRedirect } from 'next/navigation'
import { Metadata } from 'next'
import { DemandPostPageClient } from '@/components/demand/DemandPostPageClient'
import { createClient, createPublicClient, getOptionalUser } from '@/lib/supabase/server'
import { getCategoryName } from '@/lib/data/categories'
import { resolveDemandImageUrl } from '@/lib/utils/image'
import { getDemandPath, resolveUuidFromRouteParam } from '@/lib/utils/publicRoutes'
import { absoluteUrl } from '@/lib/utils'

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

function formatDemandBudget(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) {
    return `Bs ${min.toLocaleString('es-BO')} a Bs ${max.toLocaleString('es-BO')}`
  }
  if (min != null) return `Desde Bs ${min.toLocaleString('es-BO')}`
  return `Hasta Bs ${max!.toLocaleString('es-BO')}`
}

function buildDemandSocialTitle(title: string, city: string): string {
  const trimmed = title.trim()
  if (/^(busco|buscan)\b/i.test(trimmed)) {
    return `${trimmed} en ${city} | Telopillo`
  }
  return `Buscan ${trimmed} en ${city} | Telopillo`
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
    .select('title, description, category, location_city, image_url, price_min, price_max')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Solicitud no encontrada' }
  }

  const categoryName = getCategoryName(post.category)
  const imageUrl = resolveDemandImageUrl(post.image_url)
  const canonicalPath = getDemandPath(id, post.title)
  const socialTitle = buildDemandSocialTitle(post.title, post.location_city)
  const budgetLabel = formatDemandBudget(post.price_min, post.price_max)
  const description = post.description.trim()
  const socialDescription =
    description.length > 0
      ? description.slice(0, 160)
      : budgetLabel
        ? `Presupuesto ${budgetLabel} · Ver solicitud en Telopillo`
        : 'Ver solicitud en Telopillo'

  return {
    title: socialTitle,
    description: socialDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      type: 'website',
      images: imageUrl ? [imageUrl] : undefined,
      url: absoluteUrl(canonicalPath),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
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
  const canonicalPath = getDemandPath(id, post.title)
  const canonicalRouteParam = canonicalPath.split('/').pop()
  if (routeId !== canonicalRouteParam) {
    permanentRedirect(canonicalPath)
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
