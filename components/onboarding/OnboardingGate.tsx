'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { WelcomeScreen } from './WelcomeScreen'

function readSessionDismissed(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeSessionDismissed(key: string) {
  try {
    window.sessionStorage.setItem(key, 'true')
  } catch {
    // Ignore storage failures; in-memory dismiss state still prevents the modal looping.
  }
}

export function OnboardingGate() {
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const [dismissedInSession, setDismissedInSession] = useState(false)

  if (isLoading || !isAuthenticated || !user || !profile) return null

  const dismissedKey = `onboarding-dismissed:${user.id}`
  const dismissedPersisted =
    typeof window !== 'undefined' ? readSessionDismissed(dismissedKey) : false

  if (profile.onboarding_completed || dismissedInSession || dismissedPersisted) return null

  const firstName = profile.full_name?.split(' ')[0] || ''

  return (
    <WelcomeScreen
      userId={user.id}
      firstName={firstName}
      onDismiss={() => {
        writeSessionDismissed(dismissedKey)
        setDismissedInSession(true)
      }}
    />
  )
}
