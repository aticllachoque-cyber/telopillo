'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/products/ProductForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        // Redirect to login if not authenticated
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
          <p className="text-muted-foreground mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold">Publicar Producto</h1>
          <p className="text-muted-foreground mt-2">
            Completa el formulario para publicar tu producto en Telopillo.bo
          </p>
        </div>

        {/* Tips Card */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">💡 Consejos para una buena publicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Usa un título claro y descriptivo</li>
              <li>Incluye todos los detalles importantes en la descripción</li>
              <li>Sube fotos claras y bien iluminadas (mínimo 1, máximo 5)</li>
              <li>Indica el estado real del producto</li>
              <li>Establece un precio justo y competitivo</li>
            </ul>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Los campos marcados con <span className="text-destructive">*</span> son obligatorios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm userId={userId} mode="create" />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Al publicar, aceptas nuestros{' '}
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
