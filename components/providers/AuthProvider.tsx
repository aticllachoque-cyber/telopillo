'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthProvider] Failed to load profile:', error)
        return null
      }

      if (data) {
        setProfile(data)
      }
      return data
    } catch (error) {
      console.error('[AuthProvider] Unexpected error loading profile:', error)
      return null
    }
  }, [])

  useEffect(() => {
    // Use onAuthStateChange with INITIAL_SESSION instead of getUser().
    // getUser() acquires a navigator lock that conflicts with itself
    // when React strict mode double-mounts the component.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // Set BEFORE any async work — Supabase fires SIGNED_IN next
          // without awaiting this callback, so the ref must be set
          // synchronously to prevent a false "new login" toast.
          knownUserIdRef.current = session.user.id
          setUser(session.user)
          await loadProfile(session.user.id)
        }
        setIsLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
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
      if (error instanceof Error && error.name === 'AbortError') {
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
