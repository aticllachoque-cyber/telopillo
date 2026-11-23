'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import { applyPromotionToProductInternal } from '@/lib/actions/promotions'
import { productSchema } from '@/lib/validations/product'
import {
  productPromotionInputSchema,
  validatePromoPriceAgainstBase,
} from '@/lib/validations/promotion'
import { removeStorageImageByPublicUrl } from '@/lib/utils/image'

export async function createProductAction(
  input: unknown,
  promotionInput?: unknown
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de producto inválidos')
  }

  let parsedPromotion: ReturnType<typeof productPromotionInputSchema.safeParse> | null = null
  if (promotionInput !== undefined && promotionInput !== null) {
    parsedPromotion = productPromotionInputSchema.safeParse(promotionInput)
    if (!parsedPromotion.success) {
      return actionError(parsedPromotion.error.issues[0]?.message ?? 'Datos de promoción inválidos')
    }
    const priceError = validatePromoPriceAgainstBase(
      parsed.data.price,
      parsedPromotion.data.promoPrice
    )
    if (priceError) {
      return actionError(priceError)
    }
  }

  const { supabase, user } = auth
  const data = parsed.data

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory || null,
      price: data.price,
      condition: data.condition,
      location_department: data.location_department,
      location_city: data.location_city,
      images: data.images,
      status: 'active',
    })
    .select('id, title')
    .single()

  if (error || !product) {
    console.error('[createProductAction]', error?.message)
    return actionError('No se pudo publicar el producto')
  }

  if (parsedPromotion?.success) {
    const promoResult = await applyPromotionToProductInternal(
      supabase,
      user.id,
      product.id,
      data.price,
      parsedPromotion.data
    )
    if (!promoResult.success) {
      // Product is already created; report cleanly so the seller can adjust the promotion
      console.error('[createProductAction] promotion error', promoResult.error)
    }
  }

  revalidatePath('/')
  revalidatePath('/perfil/mis-productos')

  return actionSuccess({ id: product.id, title: product.title })
}

export async function updateProductAction(
  productId: string,
  input: unknown,
  previousImages: string[] = [],
  promotionInput?: unknown | null
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de producto inválidos')
  }

  let parsedPromotion: ReturnType<typeof productPromotionInputSchema.safeParse> | null = null
  if (promotionInput !== undefined && promotionInput !== null) {
    parsedPromotion = productPromotionInputSchema.safeParse(promotionInput)
    if (!parsedPromotion.success) {
      return actionError(parsedPromotion.error.issues[0]?.message ?? 'Datos de promoción inválidos')
    }
    const priceError = validatePromoPriceAgainstBase(
      parsed.data.price,
      parsedPromotion.data.promoPrice
    )
    if (priceError) {
      return actionError(priceError)
    }
  }

  const { supabase, user } = auth
  const data = parsed.data

  const { error } = await supabase
    .from('products')
    .update({
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory || null,
      price: data.price,
      condition: data.condition,
      location_department: data.location_department,
      location_city: data.location_city,
      images: data.images,
    })
    .eq('id', productId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[updateProductAction]', error.message)
    return actionError('No se pudo actualizar el producto')
  }

  if (promotionInput === null) {
    const { error: removePromoError } = await supabase
      .from('promotion_products')
      .delete()
      .eq('product_id', productId)
    if (removePromoError) {
      console.error('[updateProductAction] remove promotion error', removePromoError.message)
      return actionError('El producto se actualizó, pero no se pudo quitar la promoción')
    }
  } else if (parsedPromotion?.success) {
    const promoResult = await applyPromotionToProductInternal(
      supabase,
      user.id,
      productId,
      data.price,
      parsedPromotion.data
    )
    if (!promoResult.success) {
      return actionError(promoResult.error)
    }
  }

  const removedImages = previousImages.filter((url) => !data.images.includes(url))
  if (removedImages.length > 0) {
    try {
      await Promise.all(
        removedImages.map((url) =>
          removeStorageImageByPublicUrl(supabase.storage, 'product-images', url)
        )
      )
    } catch (cleanupError) {
      console.error('[updateProductAction] image cleanup', cleanupError)
    }
  }

  revalidatePath('/')
  revalidatePath('/perfil/mis-productos')
  revalidatePath(`/productos/${productId}`)

  return actionSuccess({ id: productId, title: data.title })
}
