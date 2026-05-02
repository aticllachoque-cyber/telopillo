import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClientOptions } from '@supabase/supabase-js'

type AuthOptions = NonNullable<SupabaseClientOptions<'public'>['auth']>

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // GoTrueClient supports lockAcquireTimeout; SSR typings omit it. Cast avoids @ts-expect-error drift on upgrades.
      auth: { lockAcquireTimeout: 30_000 } as AuthOptions,
    }
  )
}
