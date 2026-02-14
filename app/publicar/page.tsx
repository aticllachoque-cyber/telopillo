'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductFormWizard } from '@/components/products/ProductFormWizard'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PublicarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'Publicar Producto - Telopillo.bo'
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error

      if (!user) {
        router.push('/login?redirect=/publicar')
        return
      }

      setUserId(user.id)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login?redirect=/publicar')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden />
          <p className="text-muted-foreground mt-4" role="status" aria-live="polite">
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold">Publicar Producto</h1>
          <p className="text-muted-foreground mt-2">
            Completá los pasos para publicar tu producto en Telopillo.bo
          </p>
        </div>

        {/* Wizard Form */}
        <ProductFormWizard userId={userId} mode="create" />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Al publicar, aceptás nuestros{' '}
            <Link href="/terminos" className="underline hover:text-foreground">
              Términos de Uso
            </Link>{' '}
            y{' '}
            <Link href="/privacidad" className="underline hover:text-foreground">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
