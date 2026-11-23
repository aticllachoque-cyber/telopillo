import {
  extractProductPromotionFromJoin,
  type ProductPromotionFields,
  type RawPromotionProductJoinRow,
} from '@/lib/utils/promotion'

interface PromotionQueryClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

interface PromotionProductBatchRow extends RawPromotionProductJoinRow {
  product_id: string
}

/**
 * Batch-fetches active promotions for a set of products.
 * Fails open (returns empty map) if the promotions tables have not been migrated yet
 * or on transient read errors so product listings always remain available.
 */
export async function fetchActivePromotionsByProductIds(
  supabase: PromotionQueryClient,
  products: Array<{ id: string; price: number }>
): Promise<Map<string, Required<ProductPromotionFields>>> {
  const result = new Map<string, Required<ProductPromotionFields>>()
  if (products.length === 0) return result

  const priceById = new Map(products.map((p) => [p.id, Number(p.price)]))
  const productIds = [...priceById.keys()]

  try {
    const { data, error } = await supabase
      .from('promotion_products')
      .select(
        'product_id, promo_price, promotion:promotions(id, name, is_active, starts_at, ends_at)'
      )
      .in('product_id', productIds)

    if (error) {
      console.warn('[fetchActivePromotionsByProductIds] skipped:', error.message)
      return result
    }

    const now = new Date()
    for (const row of (data ?? []) as PromotionProductBatchRow[]) {
      const basePrice = priceById.get(row.product_id)
      if (basePrice == null) continue
      const extracted = extractProductPromotionFromJoin(basePrice, row, now)
      if (extracted.promo_id) {
        result.set(row.product_id, extracted)
      }
    }
  } catch (err) {
    console.warn('[fetchActivePromotionsByProductIds] error:', err)
  }

  return result
}
