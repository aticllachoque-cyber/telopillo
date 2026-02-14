'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductFormWizard } from '@/components/products/ProductFormWizard'
import type { ProductInput } from '@/lib/validations/product'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [productData, setProductData] = useState<{
    title: string
    description: string
    category: string
    subcategory?: string
    price: number
    condition: string
    location_department: string
    location_city: string
    images: string[]
  } | null>(null)

  useEffect(() => {
    document.title = 'Editar Producto - Telopillo.bo'
    loadProductData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const loadProductData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError

      if (!user) {
        router.push(`/login?redirect=/productos/${productId}/editar`)
        return
      }

      setUserId(user.id)

      // Fetch product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Not found
          setError('Producto no encontrado')
          return
        }
        throw fetchError
      }

      // Verify ownership
      if (product.user_id !== user.id) {
        setError('No tienes permiso para editar este producto')
        return
      }

      setProductData(product)
    } catch (err) {
      console.error('Error loading product:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar producto')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden />
          <p className="text-muted-foreground mt-4">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-2xl px-4 sm:px-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/perfil/mis-productos">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Mis Productos
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Ir al Inicio</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userId || !productData) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/productos/${productId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver al producto
          </Link>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground mt-2">Actualiza la información de tu publicación</p>
        </div>

        {/* Form */}
        <ProductFormWizard
          userId={userId}
          productId={productId}
          mode="edit"
          defaultValues={{
            title: productData.title,
            description: productData.description,
            category: productData.category as ProductInput['category'],
            subcategory: productData.subcategory,
            price: productData.price,
            condition: productData.condition as ProductInput['condition'],
            location_department:
              productData.location_department as ProductInput['location_department'],
            location_city: productData.location_city,
            images: productData.images || [],
          }}
        />
      </div>
    </div>
  )
}
