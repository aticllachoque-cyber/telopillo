import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to capture full Supabase auth error details.
 * Use: POST /api/debug-auth with { email, password } in body
 * Remove or protect this route in production!
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password in request body' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            // Supabase errors may have additional properties
            ...error,
            // Explicitly override to ensure these are included
            message: error.message,
            name: error.name,
            status: error.status,
            code: (error as { code?: string }).code,
          },
        },
        { status: 200 } // Return 200 so we can see the error payload
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      userId: data.user?.id,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        caughtError: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
