import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  try {
    await supabase.auth.getUser()
  } catch (error: unknown) {
    // Gracefully handle stale refresh tokens instead of logging noisy errors.
    // When a refresh token is invalid, clear the auth cookies so the browser
    // stops sending the stale token on subsequent requests.
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
    // Other auth errors are non-fatal for middleware — let the request proceed
  }

  return response
}
