'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isAbortError, isAbortLikeError } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  onboarding_completed: boolean
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Module-level singleton — stable reference across renders
const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  // Refs to keep callback references stable and avoid effect re-runs
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast
  const profileRef = useRef(profile)
  profileRef.current = profile

  // Tracks the user ID we already know about. Set synchronously (before
  // any await) so that when Supabase fires SIGNED_IN right after
  // INITIAL_SESSION, we can tell it's session restoration, not a new login.
  const knownUserIdRef = useRef<string | null>(null)

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, onboarding_completed')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // PostgREST can return an error object (not throw) when the request is aborted.
      if (isAbortLikeError(error)) {
        return null
      }
      console.error('[AuthProvider] Failed to load profile:', error.message)
      return null
    }

    if (data) {
      setProfile(data)
    }
    return data
  }, [])

  useEffect(() => {
    // INITIAL_SESSION via onAuthStateChange instead of getUser() (avoids extra lock contention).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Sync callback only — Supabase holds an auth lock while this runs; do not await other
      // Supabase client calls here (e.g. loadProfile). Defer them with void async IIFEs.

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // Must run synchronously before any deferred work so a fast SIGNED_IN does not look like a new login.
          knownUserIdRef.current = session.user.id
          setUser(session.user)
          void (async () => {
            try {
              await loadProfile(session.user.id)
            } catch (err) {
              if (isAbortError(err)) return
              console.error('[AuthProvider] load profile after INITIAL_SESSION:', err)
            } finally {
              setIsLoading(false)
            }
          })().catch((err: unknown) => {
            if (isAbortError(err)) {
              setIsLoading(false)
              return
            }
            console.error('[AuthProvider] INITIAL_SESSION profile task:', err)
            setIsLoading(false)
          })
        } else {
          setIsLoading(false)
        }
        return
      }

      void (async () => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const isNewLogin = knownUserIdRef.current !== session.user.id
            knownUserIdRef.current = session.user.id
            setUser(session.user)
            const loadedProfile = await loadProfile(session.user.id)

            if (isNewLogin) {
              const name = loadedProfile?.full_name?.split(' ')[0] || ''
              showToastRef.current(name ? `¡Bienvenido, ${name}!` : '¡Bienvenido!', 'success')
            }
          } else if (event === 'SIGNED_OUT') {
            knownUserIdRef.current = null
            setUser(null)
            setProfile(null)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user)
          }
        } catch (err) {
          if (isAbortError(err)) return
          console.error('[AuthProvider] auth state handler:', err)
        }
      })().catch((err: unknown) => {
        if (isAbortError(err)) return
        console.error('[AuthProvider] auth state handler (unhandled):', err)
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    const firstName = profileRef.current?.full_name?.split(' ')[0] || ''
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      if (isAbortError(error)) {
        console.warn('Sign out request aborted — clearing local state')
      } else {
        console.error('Sign out error:', error)
      }
    } finally {
      setUser(null)
      setProfile(null)
      showToastRef.current(firstName ? `¡Hasta pronto, ${firstName}!` : '¡Hasta pronto!', 'success')
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
