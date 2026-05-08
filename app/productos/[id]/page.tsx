import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createPublicClient, getOptionalUser } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SellerCard } from '@/components/products/SellerCard'
import { ProductActions } from '@/components/products/ProductActions'
import { ShareButton } from '@/components/products/ShareButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OwnerListingNotice } from '@/components/products/OwnerListingNotice'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { ArrowLeft, MapPin, Eye, Flag, Calendar, Tag } from 'lucide-react'
import { productPresentation } from '@/lib/constants/productPresentation'
import { cn } from '@/lib/utils'
import { CONDITION_LABELS, formatProductLocationDisplay } from '@/lib/validations/product'
import { getCategoryName } from '@/lib/data/categories'
import { absoluteUrl } from '@/lib/utils'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  resolveSellerWhatsAppDigits,
} from '@/lib/utils/whatsapp'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

/** Session + owner UI must be evaluated per request (avoid any static/cache mix-up). */
export const dynamic = 'force-dynamic'

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

  // RLS must match page body: public sees active rows only; owners may see inactive (same rules as the main query + status check below).
  const { data: product } = await supabase
    .from('products')
    .select('title, description, images, price')
    .eq('id', id)
    .maybeSingle()

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  const imageUrl = product.images?.[0] || '/og-image.png'

  const rawDescription = (product.description ?? '').trim()
  const ogDescription =
    rawDescription.length > 0
      ? rawDescription.slice(0, 160)
      : `${product.title} — Publicado en Telopillo, marketplace boliviano.`

  return {
    title: `${product.title} - Bs ${product.price.toLocaleString('es-BO')} | Telopillo`,
    description: ogDescription,
    alternates: {
      canonical: `/productos/${id}`,
    },
    openGraph: {
      title: product.title,
      description: ogDescription,
      images: [imageUrl],
      type: 'website',
      siteName: 'Telopillo',
      url: absoluteUrl(`/productos/${id}`),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: ogDescription,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const user = await getOptionalUser()
  const supabase = user ? await createClient() : createPublicClient()

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
    .select('business_name, slug, social_whatsapp')
    .eq('id', product.user_id)
    .maybeSingle()

  // Only show active products to non-owners
  const isOwner = user?.id === product.user_id

  if (product.status !== 'active' && !isOwner) {
    notFound()
  }

  // Increment views count (server-side)
  if (!isOwner) {
    await supabase.rpc('increment_product_views', { product_id: id })
  }

  const sellerProfile = product.profiles as {
    id: string
    full_name: string | null
    avatar_url: string | null
    location_city: string | null
    location_department: string | null
    phone: string | null
    verification_level: number
  }

  const sellerContact = resolveSellerWhatsAppDigits(
    businessProfile?.social_whatsapp,
    sellerProfile.phone
  )
  const normalizedSellerContact = sellerContact.normalizedDigits
  const buyerWhatsAppHref =
    !isOwner && normalizedSellerContact != null
      ? buildWhatsAppMeUrl(
          normalizedSellerContact,
          buildProductWhatsAppPrefillMessage({
            productTitle: product.title,
            price: Number(product.price),
            productAbsoluteUrl: absoluteUrl(`/productos/${id}`),
          })
        )
      : null

  const categoryName = getCategoryName(product.category)
  const conditionLabel = CONDITION_LABELS[product.condition as keyof typeof CONDITION_LABELS]
  const location = formatProductLocationDisplay(product.location_city, product.location_department)

  // Format date
  const createdDate = new Date(product.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-dvh bg-background py-8 overflow-x-hidden">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
            <li className="shrink-0">
              <Link href="/" className="hover:text-foreground">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              /
            </li>
            <li className="shrink-0">
              <Link href={`/buscar?category=${product.category}`} className="hover:text-foreground">
                {categoryName}
              </Link>
            </li>
            <li aria-hidden="true" className="shrink-0">
              /
            </li>
            <li aria-current="page" className="min-w-0">
              <span className="text-foreground truncate block">{product.title}</span>
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

        {/* Owner: explain hidden WhatsApp + listing actions */}
        {isOwner && (
          <>
            <OwnerListingNotice hasBuyerContactConfigured={normalizedSellerContact != null} />
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <ProductActions
                productId={product.id}
                productTitle={product.title}
                status={product.status}
                variant="buttons"
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Gallery + Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ProductGallery images={product.images} productTitle={product.title} />

            {/* Product Info Card */}
            <Card className="border-border/80 shadow-sm">
              <CardContent className="space-y-4 p-4 sm:p-6 sm:space-y-6">
                {/* Title and Price — aligned with listing card scale */}
                <div>
                  <h1 className={productPresentation.detailTitle}>{product.title}</h1>
                  <p className={cn(productPresentation.detailPrice, 'mt-1')}>
                    Bs {product.price.toLocaleString('es-BO')}
                  </p>
                </div>

                <Separator />

                {/* Details — single-line rows (same icon + label pattern as cards) */}
                <ul
                  className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-2"
                  aria-label="Información del producto"
                >
                  <li className={productPresentation.metaRow}>
                    <Tag className={productPresentation.metaIcon} aria-hidden />
                    <span className="min-w-0">
                      <span className={productPresentation.metaLabel}>Estado · </span>
                      <span className="font-medium">{conditionLabel}</span>
                    </span>
                  </li>
                  <li className={productPresentation.metaRow}>
                    <MapPin className={productPresentation.metaIcon} aria-hidden />
                    <span className="min-w-0">
                      <span className={productPresentation.metaLabel}>Ubicación · </span>
                      <span className="font-medium">{location}</span>
                    </span>
                  </li>
                  <li className={productPresentation.metaRow}>
                    <Eye className={productPresentation.metaIcon} aria-hidden />
                    <span className="min-w-0">
                      <span className={productPresentation.metaLabel}>Vistas · </span>
                      <span className="font-medium tabular-nums">{product.views_count}</span>
                    </span>
                  </li>
                  <li className={productPresentation.metaRow}>
                    <Calendar className={productPresentation.metaIcon} aria-hidden />
                    <span className="min-w-0">
                      <span className={productPresentation.metaLabel}>Publicado · </span>
                      <span className="font-medium">{createdDate}</span>
                    </span>
                  </li>
                </ul>

                <Separator />

                {/* Description */}
                <div>
                  <h2 className={productPresentation.sectionHeading}>Descripción</h2>
                  <p className={productPresentation.sectionBody}>{product.description}</p>
                </div>

                <Separator />

                {/* Actions — WhatsApp matches listing cards; secondary row on narrow screens */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  {buyerWhatsAppHref && (
                    <ProductWhatsAppLink
                      href={buyerWhatsAppHref}
                      ariaLabel={`Contactar al vendedor por WhatsApp sobre ${product.title}`}
                      fullWidth={false}
                      className="w-full shrink-0 sm:w-auto sm:min-w-[12rem]"
                    />
                  )}
                  <div className="flex w-full gap-2 sm:w-auto sm:flex-1 sm:justify-start">
                    <ShareButton
                      title={product.title}
                      className="flex-1 sm:flex-initial sm:min-w-[8rem]"
                    />
                    {!isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] flex flex-1 items-center justify-center gap-2 sm:flex-initial"
                      >
                        <Flag className="h-4 w-4 shrink-0" aria-hidden />
                        Reportar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Seller Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SellerCard
                seller={sellerProfile}
                productTitle={product.title}
                business={
                  businessProfile
                    ? {
                        business_name: businessProfile.business_name,
                        slug: businessProfile.slug,
                        social_whatsapp: businessProfile.social_whatsapp,
                      }
                    : null
                }
                hideContactActions={isOwner}
                productContact={
                  isOwner
                    ? undefined
                    : {
                        imageUrl: product.images?.[0] ?? null,
                        price: Number(product.price),
                        productPageUrl: absoluteUrl(`/productos/${id}`),
                      }
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
