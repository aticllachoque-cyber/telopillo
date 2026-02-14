import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Auth bypass for development
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    const protectedRoutes = ['/profile', '/perfil', '/publicar', '/mensajes']
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If no user session, auto-login with dev credentials
      if (!user) {
        const devEmail = process.env.DEV_TEST_EMAIL || 'dev@telopillo.test'
        const devPassword = process.env.DEV_TEST_PASSWORD || 'DevTest123'

        const { error } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        })

        if (error) {
          console.error('Auth bypass failed:', error.message)
          // Continue to normal flow if bypass fails
          return await updateSession(request)
        }

        // Redirect to same page to refresh with new session
        return NextResponse.redirect(request.url)
      }
    }

    // Allow all requests when auth bypass is enabled
    return await updateSession(request)
  }

  // Normal auth flow (when bypass is disabled)
  const response = await updateSession(request)

  // Get user after session update
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - require authentication
  const protectedRoutes = ['/profile/edit', '/perfil', '/publicar', '/mensajes']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth routes - redirect authenticated users away
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isAuthRoute && user) {
    // Check if there's a redirect parameter
    const redirect = request.nextUrl.searchParams.get('redirect')
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
