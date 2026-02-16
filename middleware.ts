import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

// Protected routes: prefix matching (startsWith)
const PROTECTED_PREFIXES = ['/profile', '/perfil', '/publicar', '/mensajes']

// Protected routes: pattern matching (regex) for paths that can't use prefix
const PROTECTED_PATTERNS = [
  /^\/productos\/[^/]+\/editar$/, // /productos/[id]/editar
]

function isProtectedRoute(pathname: string): boolean {
  return (
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname))
  )
}

export async function middleware(request: NextRequest) {
  // Auth bypass for development only (server-side env var, never exposed to browser)
  const disableAuth = process.env.DISABLE_AUTH === 'true'
  if (disableAuth && process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY: DISABLE_AUTH must not be true in production. Ignoring.')
  }
  const authBypass = disableAuth && process.env.NODE_ENV !== 'production'

  if (authBypass) {
    // Log warning that bypass is active (only once per startup would be ideal, but middleware is stateless)
    console.warn('⚠️  AUTH BYPASS ENABLED - Development mode only')

    if (isProtectedRoute(request.nextUrl.pathname)) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If no user session, auto-login with dev credentials
      if (!user) {
        const devEmail = process.env.DEV_TEST_EMAIL
        const devPassword = process.env.DEV_TEST_PASSWORD

        // Check if credentials are configured
        if (!devEmail || !devPassword) {
          console.error(
            '❌ Auth bypass enabled but DEV_TEST_EMAIL/DEV_TEST_PASSWORD not set. Redirecting to login.'
          )
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          url.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(url)
        }

        console.log(`🔓 Auth bypass: Auto-logging in as ${devEmail}`)
        const { error } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        })

        if (error) {
          console.error(`❌ Auth bypass auto-login failed: ${error.message}. Redirecting to login.`)
          const url = request.nextUrl.clone()
          url.pathname = '/login'
          url.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(url)
        }

        console.log('✅ Auth bypass: Login successful, redirecting')
        return NextResponse.redirect(request.url)
      }
    }

    return await updateSession(request)
  }

  // Normal auth flow
  const response = await updateSession(request)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (isProtectedRoute(request.nextUrl.pathname) && !user) {
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
