'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Megaphone, Target, UserCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface WelcomeScreenProps {
  userId: string
  firstName: string
  onDismiss: () => void
}

type DismissAction = 'explore' | 'profile' | null

const VALUE_POINTS = [
  { Icon: Search, text: 'Pillá lo que buscás o publicá gratis' },
  { Icon: Target, text: 'Publicá lo que necesitás (Busco/Necesito)' },
  { Icon: Megaphone, text: 'Llegá a compradores en toda Bolivia' },
  { Icon: UserCircle, text: 'Completá tu perfil para más confianza' },
]

export function WelcomeScreen({ userId, firstName, onDismiss }: WelcomeScreenProps) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<DismissAction>(null)
  const { showToast } = useToast()
  const supabase = createClient()

  const isDismissing = activeAction !== null

  const markOnboardingComplete = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)

    if (error) throw error
  }

  const handleExplore = async () => {
    setActiveAction('explore')
    try {
      await markOnboardingComplete()
      onDismiss()
    } catch {
      showToast('No se pudo guardar. Intentá de nuevo.', 'error')
      setActiveAction(null)
    }
  }

  const handleCompleteProfile = async () => {
    setActiveAction('profile')
    try {
      await markOnboardingComplete()
      router.push('/profile/edit')
    } catch {
      showToast('No se pudo guardar. Intentá de nuevo.', 'error')
      setActiveAction(null)
    }
  }

  const displayName = firstName?.length > 20 ? firstName.slice(0, 20) + '…' : firstName

  return (
    <Dialog open onOpenChange={() => handleExplore()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-md [&>button:last-child]:flex [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:size-11 [&>button:last-child]:top-3 [&>button:last-child]:right-3 [&>button:last-child]:rounded-full [&>button:last-child]:bg-muted [&>button:last-child]:opacity-100 [&>button:last-child_svg]:size-5">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="size-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-balance text-2xl font-bold sm:text-3xl">
              {displayName ? `¡Bienvenido, ${displayName}!` : '¡Bienvenido a Telopillo!'}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Comprá y vendé en Bolivia. Sin comisiones.
            </DialogDescription>
          </div>

          <ul className="mx-auto max-w-sm space-y-3 text-left">
            {VALUE_POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <point.Icon className="size-4 text-primary" aria-hidden />
                </div>
                <span className="text-pretty text-sm text-foreground">{point.text}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleExplore}
              disabled={isDismissing}
              className="h-11 w-full"
              size="lg"
              aria-busy={activeAction === 'explore'}
            >
              {activeAction === 'explore' ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              Empezar a explorar
            </Button>
            <Button
              onClick={handleCompleteProfile}
              disabled={isDismissing}
              variant="outline"
              className="h-11 w-full"
              size="lg"
              aria-busy={activeAction === 'profile'}
            >
              {activeAction === 'profile' ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              Completar perfil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
