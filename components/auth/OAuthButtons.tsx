'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(provider)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      setError(getAuthErrorMessage(error, 'Error al iniciar sesión'))
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-[44px]"
        onClick={() => handleOAuth('google')}
        disabled={isLoading !== null}
        aria-label="Continuar con Google"
      >
        <FcGoogle className="mr-2 h-5 w-5" aria-hidden />
        {isLoading === 'google' ? 'Conectando...' : 'Continuar con Google'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-[44px]"
        onClick={() => handleOAuth('facebook')}
        disabled={isLoading !== null}
        aria-label="Continuar con Facebook"
      >
        <FaFacebook className="mr-2 h-5 w-5 text-blue-600" aria-hidden />
        {isLoading === 'facebook' ? 'Conectando...' : 'Continuar con Facebook'}
      </Button>
    </div>
  )
}
