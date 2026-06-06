import type { createPublicClient } from '@/lib/supabase/server'

type PublicSupabaseClient = ReturnType<typeof createPublicClient>

export async function fetchSellerContactPhonesByUserId(
  supabase: PublicSupabaseClient,
  userIds: Iterable<string>
): Promise<Map<string, string | null>> {
  const uniqueIds = [...new Set(userIds)].filter(Boolean)
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data } = await supabase.rpc('get_seller_contact_phone', {
        p_user_id: userId,
      })
      const phone = typeof data === 'string' && data.trim() ? data.trim() : null
      return [userId, phone] as const
    })
  )

  return new Map(entries)
}

interface ProductSearchRow {
  user_id?: string
  seller_business_whatsapp?: string | null
  seller_profile_phone?: string | null
  seller_whatsapp_phone?: string | null
}

export function enrichProductSearchRows<T extends ProductSearchRow>(
  products: T[],
  contactByUserId: Map<string, string | null>
): T[] {
  return products.map((product) => {
    const userId = product.user_id
    if (!userId) return product

    const profilePhone = contactByUserId.get(userId) ?? null
    const businessWhatsapp = product.seller_business_whatsapp?.trim() || null

    return {
      ...product,
      seller_profile_phone: profilePhone,
      seller_whatsapp_phone: businessWhatsapp ?? profilePhone,
    }
  })
}

interface DemandSearchRow {
  user_id?: string
  poster_phone?: string | null
}

export function enrichDemandSearchRows<T extends DemandSearchRow>(
  demands: T[],
  contactByUserId: Map<string, string | null>
): T[] {
  return demands.map((demand) => {
    const userId = demand.user_id
    if (!userId) return demand

    return {
      ...demand,
      poster_phone: contactByUserId.get(userId) ?? null,
    }
  })
}
