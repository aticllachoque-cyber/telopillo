import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createPublicClient, getOptionalUser } from '@/lib/supabase/server'
import { DemandPostDetail } from '@/components/demand/DemandPostDetail'
import { ArrowLeft } from 'lucide-react'
import { getCategoryName } from '@/lib/data/categories'
import { resolveDemandImageUrl } from '@/lib/utils/image'

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
  const { id } = await params
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
  const { id } = await params
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
    .select('business_name, slug')
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

  const mapped = ((rawOffers ?? []) as RawOffer[]).map((o) => ({
    ...o,
    products: Array.isArray(o.products) ? (o.products[0] ?? null) : o.products,
    seller: Array.isArray(o.seller) ? (o.seller[0] ?? null) : o.seller,
  }))
  // Only pass offers with a valid product_id (OfferRow requires it)
  const offers = mapped.filter((o): o is typeof o & { product_id: string } => o.product_id != null)

  return (
    <div className="min-h-dvh bg-background py-8 pb-24 lg:pb-8">
      <div className="container px-4 sm:px-6">
        <Link
          href="/busco"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 min-h-[44px] -my-2 py-2 -ml-2 pl-2 pr-2 touch-manipulation"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Volver a solicitudes
        </Link>

        <DemandPostDetail
          post={post}
          poster={poster}
          posterBusiness={posterBusiness}
          offers={offers}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
