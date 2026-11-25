'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import {
  productPromotionInputSchema,
  validatePromoPriceAgainstBase,
  type ProductPromotionInput,
} from '@/lib/validations/promotion'
import { roundBobAmount } from '@/lib/utils/promotion'
import type { createClient } from '@/lib/supabase/server'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface SellerPromotionSummary {
  id: string
  name: string
  default_discount_percent: number | null
  is_active: boolean
  products_count: number
  created_at: string
}

export interface ProductPromotionResult {
  promo_id: string
  promo_name: string
  promo_price: number
}

/**
 * Shared internal helper to attach a validated promotion payload to a seller's product.
 * Used by both `upsertProductPromotionAction` and `createProductAction`/`updateProductAction`.
 */
export async function applyPromotionToProductInternal(
  supabase: ServerSupabaseClient,
  userId: string,
  productId: string,
  basePrice: number,
  parsed: ProductPromotionInput
): Promise<ActionResult<ProductPromotionResult>> {
  const roundedPromoPrice = roundBobAmount(parsed.promoPrice)
  const priceError = validatePromoPriceAgainstBase(basePrice, roundedPromoPrice)
  if (priceError) {
    return actionError(priceError)
  }

  let promotionId: string
  let promotionName: string

  if (parsed.mode === 'existing') {
    const { data: existingPromo, error: promoError } = await supabase
      .from('promotions')
      .select('id, name, is_active')
      .eq('id', parsed.promotionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (promoError || !existingPromo) {
      return actionError('La promoción seleccionada no existe o no te pertenece')
    }

    if (!existingPromo.is_active) {
      const { error: activateError } = await supabase
        .from('promotions')
        .update({ is_active: true })
        .eq('id', existingPromo.id)
        .eq('user_id', userId)

      if (activateError) {
        console.error('[applyPromotionToProductInternal] activate error', activateError.message)
        return actionError('No se pudo activar la promoción seleccionada')
      }
    }

    promotionId = existingPromo.id
    promotionName = existingPromo.name
  } else {
    // Reuse or update in-place when editing an existing product promotion to avoid duplicate rows
    let resolvedExisting = false
    if (parsed.replacePromotionId) {
      const [{ data: currentPromo }, { count: otherProductsCount }] = await Promise.all([
        supabase
          .from('promotions')
          .select('id, name, is_active')
          .eq('id', parsed.replacePromotionId)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('promotion_products')
          .select('id', { count: 'exact', head: true })
          .eq('promotion_id', parsed.replacePromotionId)
          .neq('product_id', productId),
      ])

      const isShared = (otherProductsCount ?? 0) > 0

      if (currentPromo && currentPromo.name.trim() === parsed.name.trim()) {
        // Seller only updated this product's promo price; reuse the existing promotion row
        if (!isShared || !currentPromo.is_active) {
          const updateFields: Record<string, unknown> = { is_active: true }
          if (!isShared) {
            updateFields.default_discount_percent = parsed.defaultDiscountPercent ?? null
          }
          await supabase
            .from('promotions')
            .update(updateFields)
            .eq('id', currentPromo.id)
            .eq('user_id', userId)
        }
        promotionId = currentPromo.id
        promotionName = currentPromo.name
        resolvedExisting = true
      } else if (currentPromo && !isShared) {
        const { data: updatedPromo, error: updateError } = await supabase
          .from('promotions')
          .update({
            name: parsed.name,
            default_discount_percent: parsed.defaultDiscountPercent ?? null,
            is_active: true,
          })
          .eq('id', parsed.replacePromotionId)
          .eq('user_id', userId)
          .select('id, name')
          .maybeSingle()

        if (!updateError && updatedPromo) {
          promotionId = updatedPromo.id
          promotionName = updatedPromo.name
          resolvedExisting = true
        }
      }
    }

    if (!resolvedExisting) {
      const { data: createdPromo, error: createError } = await supabase
        .from('promotions')
        .insert({
          user_id: userId,
          name: parsed.name,
          default_discount_percent: parsed.defaultDiscountPercent ?? null,
          is_active: true,
        })
        .select('id, name')
        .single()

      if (createError || !createdPromo) {
        console.error('[applyPromotionToProductInternal] create error', createError?.message)
        return actionError('No se pudo crear la promoción')
      }

      promotionId = createdPromo.id
      promotionName = createdPromo.name
    }
  }

  const { error: upsertError } = await supabase.from('promotion_products').upsert(
    {
      product_id: productId,
      promotion_id: promotionId!,
      promo_price: roundedPromoPrice,
    },
    { onConflict: 'product_id' }
  )

  if (upsertError) {
    console.error('[applyPromotionToProductInternal] upsert error', upsertError.message)
    return actionError('No se pudo aplicar la promoción al producto')
  }

  return actionSuccess({
    promo_id: promotionId!,
    promo_name: promotionName!,
    promo_price: roundedPromoPrice,
  })
}

/**
 * List promotions created by the authenticated seller, along with how many products use each one.
 */
export async function listMyPromotionsAction(): Promise<ActionResult<SellerPromotionSummary[]>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const { supabase, user } = auth

  const { data, error } = await supabase
    .from('promotions')
    .select('id, name, default_discount_percent, is_active, created_at, promotion_products(count)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[listMyPromotionsAction]', error.message)
    return actionError('No se pudieron cargar tus promociones')
  }

  const summaries: SellerPromotionSummary[] = (data ?? []).map((row) => {
    const rawCount = (row as { promotion_products?: Array<{ count: number }> | { count: number } })
      .promotion_products
    const count = Array.isArray(rawCount) ? (rawCount[0]?.count ?? 0) : (rawCount?.count ?? 0)

    return {
      id: row.id,
      name: row.name,
      default_discount_percent: row.default_discount_percent,
      is_active: row.is_active,
      products_count: count,
      created_at: row.created_at,
    }
  })

  return actionSuccess(summaries)
}

/**
 * Create or update the active promotion for a single published product owned by the seller.
 */
export async function upsertProductPromotionAction(
  productId: string,
  input: unknown
): Promise<ActionResult<ProductPromotionResult>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = productPromotionInputSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de promoción inválidos')
  }

  const { supabase, user } = auth

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, user_id, price, status')
    .eq('id', productId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (productError || !product) {
    return actionError('Producto no encontrado o sin permisos')
  }

  if (product.status !== 'active') {
    return actionError('Solo podés agregar promociones a productos activos')
  }

  const result = await applyPromotionToProductInternal(
    supabase,
    user.id,
    product.id,
    Number(product.price),
    parsed.data
  )

  if (result.success) {
    revalidatePath('/')
    revalidatePath('/perfil/mis-productos')
    revalidatePath(`/productos/${product.id}`)
  }

  return result
}

/**
 * Remove the active promotion assignment from a seller's product.
 * Keeps the promotion record itself in `promotions` so it can be reused later.
 */
export async function removeProductPromotionAction(
  productId: string
): Promise<ActionResult<{ productId: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const { supabase, user } = auth

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, user_id')
    .eq('id', productId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (productError || !product) {
    return actionError('Producto no encontrado o sin permisos')
  }

  const { error: deleteError } = await supabase
    .from('promotion_products')
    .delete()
    .eq('product_id', product.id)

  if (deleteError) {
    console.error('[removeProductPromotionAction]', deleteError.message)
    return actionError('No se pudo quitar la promoción del producto')
  }

  revalidatePath('/')
  revalidatePath('/perfil/mis-productos')
  revalidatePath(`/productos/${product.id}`)

  return actionSuccess({ productId: product.id })
}
