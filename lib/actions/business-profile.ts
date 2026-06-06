'use server'

import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import { businessProfileSchema } from '@/lib/validations/business-profile'

export async function upsertBusinessProfileAction(
  input: unknown,
  hasExistingProfile: boolean
): Promise<ActionResult> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = businessProfileSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de negocio inválidos')
  }

  const { supabase, user } = auth
  const data = parsed.data

  const payload = {
    business_name: data.business_name,
    business_description: data.business_description || null,
    business_category: data.business_category || null,
    nit: data.nit || null,
    website_url: data.website_url || null,
    social_facebook: data.social_facebook || null,
    social_instagram: data.social_instagram || null,
    social_tiktok: data.social_tiktok || null,
    social_whatsapp: data.social_whatsapp || null,
    business_hours: data.business_hours ?? null,
    business_address: data.business_address || null,
    business_department: data.business_department || null,
    business_city: data.business_city || null,
  }

  if (hasExistingProfile) {
    const { error } = await supabase.from('business_profiles').update(payload).eq('id', user.id)
    if (error) {
      console.error('[upsertBusinessProfileAction] update', error.message)
      return actionError('No se pudo guardar el perfil de negocio')
    }
    return actionSuccess()
  }

  const { data: slugResult, error: slugError } = await supabase.rpc('generate_slug', {
    input: data.business_name,
  })

  if (slugError) {
    console.error('[upsertBusinessProfileAction] slug', slugError.message)
    return actionError('No se pudo generar el enlace de la tienda')
  }

  const { error: insertError } = await supabase.from('business_profiles').insert({
    id: user.id,
    slug: slugResult || 'negocio',
    ...payload,
  })

  if (insertError) {
    console.error('[upsertBusinessProfileAction] insert', insertError.message)
    return actionError('No se pudo crear el perfil de negocio')
  }

  return actionSuccess()
}
