import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function requireAuthenticatedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return { supabase, user }
}
