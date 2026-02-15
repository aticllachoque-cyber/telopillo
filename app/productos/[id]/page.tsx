import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SellerCard } from '@/components/products/SellerCard'
import { ProductActions } from '@/components/products/ProductActions'
import { ShareButton } from '@/components/products/ShareButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Eye, Flag, Calendar, Tag } from 'lucide-react'
import { CONDITION_LABELS } from '@/lib/validations/product'
import { getCategoryName } from '@/lib/data/categories'

interface ProductPageProps {
  params: {
    id: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { id } = await params

  const { data: product } = await supabase
    .from('products')
    .select('title, description, images, price')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  const imageUrl = product.images?.[0] || '/og-image.png'

  return {
    title: `${product.title} - Bs ${product.price.toLocaleString('es-BO')} | Telopillo.bo`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: [imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description.slice(0, 160),
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch product with seller profile
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        location_city,
        location_department,
        phone,
        verification_level
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Fetch business profile for the seller (separate query — no direct FK from products)
  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('business_name, slug')
    .eq('id', product.user_id)
    .single()

  // Only show active products to non-owners
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === product.user_id

  if (product.status !== 'active' && !isOwner) {
    notFound()
  }

  // Increment views count (server-side)
  if (!isOwner) {
    await supabase.rpc('increment_product_views', { product_id: params.id })
  }

  const categoryName = getCategoryName(product.category)
  const conditionLabel = CONDITION_LABELS[product.condition as keyof typeof CONDITION_LABELS]
  const location = `${product.location_city}, ${product.location_department}`

  // Format date
  const createdDate = new Date(product.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-7xl">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categorias/${product.category}`} className="hover:text-foreground">
                {categoryName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">
              <span className="text-foreground truncate">{product.title}</span>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Volver
        </Link>

        {/* Owner Badge */}
        {isOwner && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              Este es tu producto
            </Badge>
            <ProductActions productId={product.id} status={product.status} variant="buttons" />
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Gallery + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ProductGallery images={product.images} productTitle={product.title} />

            {/* Product Info Card */}
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Title and Price */}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                  <p className="text-4xl font-bold text-primary">
                    Bs {product.price.toLocaleString('es-BO')}
                  </p>
                </div>

                <Separator />

                {/* Details Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="font-medium">{conditionLabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Vistas</p>
                      <p className="font-medium">{product.views_count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-xs text-muted-foreground">Publicado</p>
                      <p className="font-medium">{createdDate}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h2 className="text-xl font-semibold mb-3">Descripción</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <ShareButton title={product.title} />

                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Flag className="h-4 w-4" aria-hidden />
                    Reportar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Seller Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SellerCard
                seller={product.profiles}
                productTitle={product.title}
                business={businessProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
