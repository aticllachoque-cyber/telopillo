'use server'

import { requireAuthenticatedUser } from '@/lib/actions/auth'
import { actionError, actionSuccess, type ActionResult } from '@/lib/actions/result'
import { profileSchema } from '@/lib/validations/profile'

export async function updateProfileAction(
  input: unknown
): Promise<ActionResult<{ verification_level: number }>> {
  const auth = await requireAuthenticatedUser()
  if (!auth) {
    return actionError('No autenticado')
  }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Datos de perfil inválidos')
  }

  const { supabase, user } = auth
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      location_department: parsed.data.location_department,
      location_city: parsed.data.location_city,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfileAction]', error.message)
    return actionError('No se pudo guardar el perfil')
  }

  const { data: updatedProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('verification_level')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return actionSuccess({ verification_level: 0 })
  }

  return actionSuccess({ verification_level: updatedProfile.verification_level ?? 0 })
}
