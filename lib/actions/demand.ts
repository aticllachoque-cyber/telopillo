'use server'

import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import { demandOfferSchema, demandPostSchema } from '@/lib/validations/demand'

export async function createDemandPostAction(
  input: unknown
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = demandPostSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de solicitud inválidos')
  }

  const { supabase, user } = auth
  const data = parsed.data

  const { data: post, error } = await supabase
    .from('demand_posts')
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory || null,
      location_department: data.location_department,
      location_city: data.location_city,
      price_min: data.price_min ?? null,
      price_max: data.price_max ?? null,
      image_url: data.image_url ?? null,
    })
    .select('id, title')
    .single()

  if (error || !post) {
    console.error('[createDemandPostAction]', error?.message)
    return actionError('No se pudo publicar la solicitud')
  }

  return actionSuccess({ id: post.id, title: post.title })
}

export async function updateDemandPostAction(
  demandPostId: string,
  input: unknown
): Promise<ActionResult<{ id: string; title: string }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = demandPostSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de solicitud inválidos')
  }

  const { supabase, user } = auth
  const data = parsed.data

  const { data: post, error } = await supabase
    .from('demand_posts')
    .update({
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory || null,
      location_department: data.location_department,
      location_city: data.location_city,
      price_min: data.price_min ?? null,
      price_max: data.price_max ?? null,
      image_url: data.image_url ?? null,
    })
    .eq('id', demandPostId)
    .eq('user_id', user.id)
    .select('id, title')
    .single()

  if (error || !post) {
    console.error('[updateDemandPostAction]', error?.message)
    return actionError('No se pudo actualizar la solicitud')
  }

  return actionSuccess({ id: post.id, title: post.title })
}

export async function createDemandOfferAction(input: unknown): Promise<ActionResult> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = demandOfferSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de oferta inválidos')
  }

  const { supabase, user } = auth
  const data = parsed.data

  const { error } = await supabase.from('demand_offers').insert({
    demand_post_id: data.demand_post_id,
    product_id: data.product_id,
    seller_id: user.id,
    message: data.message ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return actionError('Ya ofreciste este producto para esta solicitud.')
    }
    console.error('[createDemandOfferAction]', error.message)
    return actionError('No se pudo enviar la oferta')
  }

  return actionSuccess()
}
