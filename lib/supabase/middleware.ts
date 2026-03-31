import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isLocalSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  const u = url.replace(/\/$/, '')
  return (
    u.startsWith('http://127.0.0.1') ||
    u.startsWith('http://localhost') ||
    u.startsWith('https://127.0.0.1') ||
    u.startsWith('https://localhost')
  )
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // In dev, Edge runtime often cannot reach local Supabase (fetch to 127.0.0.1 fails). Skip the call to avoid "fetch failed" spam; pages will enforce auth.
  const isDev = process.env.NODE_ENV === 'development'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (isDev && isLocalSupabaseUrl(supabaseUrl)) {
    return { response, user: null, sessionCheckSkipped: true }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error: unknown) {
    // Gracefully handle stale refresh tokens instead of logging noisy errors.
    const isRefreshTokenError =
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'refresh_token_not_found'

    if (isRefreshTokenError) {
      const authCookiePrefix = 'sb-'
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith(authCookiePrefix)) {
          response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
        }
      })
    }
    // Fetch failed / network errors (e.g. Supabase local unreachable from Edge): proceed without user
    if (error instanceof Error && (error.message === 'fetch failed' || error.cause != null)) {
      // Avoid spamming console; treat as no session
    }
  }

  return { response, user, sessionCheckSkipped: false }
}
