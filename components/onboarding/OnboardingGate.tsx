'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { WelcomeScreen } from './WelcomeScreen'

export function OnboardingGate() {
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || !isAuthenticated || !user || !profile) return null
  if (profile.onboarding_completed || dismissed) return null

  const firstName = profile.full_name?.split(' ')[0] || ''

  return (
    <WelcomeScreen userId={user.id} firstName={firstName} onDismiss={() => setDismissed(true)} />
  )
}
