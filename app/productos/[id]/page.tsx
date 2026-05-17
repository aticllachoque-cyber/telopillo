import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient, createPublicClient, getOptionalUser } from '@/lib/supabase/server'
import { ProductDetailPageClient } from '@/components/products/ProductDetailPageClient'
import { absoluteUrl } from '@/lib/utils'
import { getProductPath, resolveUuidFromRouteParam } from '@/lib/utils/publicRoutes'
import { resolveProductImageUrl } from '@/lib/utils/image'
import { resolveSellerWhatsAppDigits } from '@/lib/utils/whatsapp'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

/** Session + owner UI must be evaluated per request (avoid any static/cache mix-up). */
export const dynamic = 'force-dynamic'

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id: routeId } = await params
  const id = resolveUuidFromRouteParam(routeId)
  if (!id) {
    return {
      title: 'Producto no encontrado',
    }
  }
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

  // RLS must match page body: public sees active rows only; owners may see inactive (same rules as the main query + status check below).
  const { data: product } = await supabase
    .from('products')
    .select('title, description, images, price')
    .eq('id', id)
    .maybeSingle()

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  const imageUrl = resolveProductImageUrl(product.images?.[0]) || '/og-image.png'

  const rawDescription = (product.description ?? '').trim()
  const ogDescription =
    rawDescription.length > 0
      ? rawDescription.slice(0, 160)
      : `${product.title} — Publicado en Telopillo, marketplace boliviano.`

  return {
    title: `${product.title} - Bs ${product.price.toLocaleString('es-BO')} | Telopillo`,
    description: ogDescription,
    alternates: {
      canonical: getProductPath(id),
    },
    openGraph: {
      title: product.title,
      description: ogDescription,
      images: [imageUrl],
      type: 'website',
      siteName: 'Telopillo',
      url: absoluteUrl(getProductPath(id)),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: ogDescription,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: routeId } = await params
  const id = resolveUuidFromRouteParam(routeId)
  if (!id) {
    notFound()
  }
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        location_city,
        location_department,
        phone,
        verification_level
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('business_name, slug, social_whatsapp')
    .eq('id', product.user_id)
    .maybeSingle()

  const isOwner = user?.id === product.user_id
  if (product.status !== 'active' && !isOwner) {
    notFound()
  }

  if (!isOwner) {
    await supabase.rpc('increment_product_views', { product_id: id })
  }

  const sellerProfile = product.profiles as {
    id: string
    full_name: string | null
    avatar_url: string | null
    location_city: string | null
    location_department: string | null
    phone: string | null
    verification_level: number
  }

  return (
    <ProductDetailPageClient
      initialData={{
        product: {
          ...product,
          views_count: isOwner ? product.views_count : product.views_count + 1,
        },
        sellerProfile,
        businessProfile: businessProfile
          ? {
              business_name: businessProfile.business_name,
              slug: businessProfile.slug,
              social_whatsapp: businessProfile.social_whatsapp,
            }
          : null,
        isOwner,
        currentUserId: user?.id ?? null,
        normalizedSellerContact:
          resolveSellerWhatsAppDigits(businessProfile?.social_whatsapp, sellerProfile.phone)
            .normalizedDigits ?? null,
      }}
    />
  )
}
