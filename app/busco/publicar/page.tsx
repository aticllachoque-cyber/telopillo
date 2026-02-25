'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DemandPostForm } from '@/components/demand/DemandPostForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const MAX_POSTS_PER_DAY = 5

export default function PublicarDemandaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rateLimitReached, setRateLimitReached] = useState(false)

  useEffect(() => {
    document.title = 'Publicar lo que buscas - Telopillo.bo'
    checkAuthAndRateLimit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndRateLimit = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      if (!user) {
        router.push('/login?redirect=/busco/publicar')
        return
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error: countError } = await supabase
        .from('demand_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)

      if (countError) throw countError

      if (count != null && count >= MAX_POSTS_PER_DAY) {
        setRateLimitReached(true)
      }

      setUserId(user.id)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login?redirect=/busco/publicar')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background py-8" aria-busy="true">
        <div className="container max-w-2xl px-4 sm:px-6">
          <div className="mb-8 space-y-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-8 w-64 rounded bg-muted animate-pulse" />
            <div className="h-4 w-80 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                <div className="h-11 w-full rounded-md border bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container max-w-2xl px-4 sm:px-6">
        <div className="mb-8">
          <Link
            href="/busco"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[44px] -my-2 py-2 -ml-2 pl-2 pr-2 touch-manipulation"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver a solicitudes
          </Link>
          <h1 className="text-3xl font-bold text-balance">Publica lo que buscas</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Completá el formulario y los vendedores podrán contactarte con lo que necesitás.
          </p>
        </div>

        {rateLimitReached ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive text-balance">
              Alcanzaste el límite de {MAX_POSTS_PER_DAY} solicitudes por día
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-pretty">
              Intenta de nuevo mañana. Mientras tanto, puedes revisar las solicitudes existentes.
            </p>
            <Link
              href="/busco"
              className="inline-flex items-center mt-4 text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
            >
              Ver solicitudes
            </Link>
          </div>
        ) : (
          <DemandPostForm userId={userId} />
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Al publicar, aceptas nuestros{' '}
            <Link
              href="/terminos"
              className="underline hover:text-foreground inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Términos de Uso
            </Link>{' '}
            y{' '}
            <Link
              href="/privacidad"
              className="underline hover:text-foreground inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
