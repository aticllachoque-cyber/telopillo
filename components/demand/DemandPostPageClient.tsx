'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DemandPostDetail } from '@/components/demand/DemandPostDetail'

interface DemandPostPageClientProps {
  initialData: DemandPostResponse
}

interface DemandPostResponse {
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
    social_whatsapp: string | null
  } | null
  offers: Array<{
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
  }>
  currentUserId: string | null
}

export function DemandPostPageClient({ initialData }: DemandPostPageClientProps) {
  return (
    <div className="min-h-dvh bg-background py-8 pb-24 lg:pb-8">
      <div className="container px-4 sm:px-6">
        <Link
          href="/busco"
          className="mb-6 inline-flex min-h-[44px] touch-manipulation items-center py-2 pl-2 pr-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Volver a solicitudes
        </Link>

        <DemandPostDetail
          post={initialData.post}
          poster={initialData.poster}
          posterBusiness={initialData.posterBusiness}
          offers={initialData.offers}
          currentUserId={initialData.currentUserId}
        />
      </div>
    </div>
  )
}
