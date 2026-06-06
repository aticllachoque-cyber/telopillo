'use server'

import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import { productSchema } from '@/lib/validations/product'
import { removeStorageImageByPublicUrl } from '@/lib/utils/image'

export async function createProductAction(
  input: unknown
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de producto inválidos')
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

  return actionSuccess({ id: product.id, title: product.title })
}

export async function updateProductAction(
  productId: string,
  input: unknown,
  previousImages: string[] = []
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de producto inválidos')
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

  return actionSuccess({ id: productId, title: data.title })
}
