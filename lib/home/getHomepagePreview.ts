import { createClient } from '@/lib/supabase/server'
import type { SearchDemandPost } from '@/types/database'

export interface HomepagePreviewProduct {
  id: string
  user_id: string
  title: string
  price: number
  images: string[]
  status: string
  location_city: string
  location_department: string
  views_count: number
  created_at: string
}

interface HomepagePreviewData {
  products: HomepagePreviewProduct[]
  demands: SearchDemandPost[]
}

const HOMEPAGE_PRODUCT_LIMIT = 6
const HOMEPAGE_DEMAND_LIMIT = 4

export async function getHomepagePreview(): Promise<HomepagePreviewData> {
  const supabase = await createClient()

  const [productsResult, demandsResult] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, user_id, title, price, images, status, location_city, location_department, views_count, created_at'
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(HOMEPAGE_PRODUCT_LIMIT),
    supabase
      .from('demand_posts')
      .select(
        'id, user_id, title, description, category, subcategory, location_department, location_city, price_min, price_max, image_url, status, offers_count, expires_at, created_at, updated_at'
      )
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(HOMEPAGE_DEMAND_LIMIT),
  ])

  if (productsResult.error) {
    console.error('[HomepagePreview] Failed to load product preview:', productsResult.error.message)
  }

  if (demandsResult.error) {
    console.error('[HomepagePreview] Failed to load demand preview:', demandsResult.error.message)
  }

  const demands: SearchDemandPost[] = (demandsResult.data ?? []).map((post) => ({
    ...post,
    relevance_score: 0,
    poster_name: null,
    poster_avatar_url: null,
    poster_phone: null,
    poster_verification_level: 0,
    poster_business_name: null,
    poster_business_slug: null,
  }))

  return {
    products: productsResult.data ?? [],
    demands,
  }
}
