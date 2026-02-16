import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Allowed redirect origins for OAuth callback (prevents open-redirect attacks)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL, // e.g., http://localhost:3003 in dev
  process.env.NEXT_PUBLIC_APP_URL, // Fallback app URL
  'https://telopillo.bo', // Production domain
  // Allow common dev ports for convenience (remove in production via env check)
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3003']
    : []),
].filter(Boolean) as string[]

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Validate the redirect origin to prevent open-redirect attacks
  const redirectUrl = ALLOWED_ORIGINS.includes(origin)
    ? `${origin}/`
    : `${ALLOWED_ORIGINS[0] || 'https://telopillo.bo'}/`

  return NextResponse.redirect(redirectUrl)
}
