'use client'

import Link from 'next/link'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SellerCard } from '@/components/products/SellerCard'
import { ProductActions } from '@/components/products/ProductActions'
import { ShareButton } from '@/components/products/ShareButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { OwnerListingNotice } from '@/components/products/OwnerListingNotice'
import { ArrowLeft, Eye, Flag, Calendar, MapPin, Tag } from 'lucide-react'
import { productPresentation } from '@/lib/constants/productPresentation'
import { cn, absoluteUrl } from '@/lib/utils'
import { CONDITION_LABELS, formatProductLocationDisplay } from '@/lib/validations/product'
import { getCategoryName } from '@/lib/data/categories'
import { getProductPath } from '@/lib/utils/publicRoutes'
import { resolveProductImageUrls } from '@/lib/utils/image'

interface ProductDetailPageClientProps {
  initialData: ProductDetailResponse
}

interface ProductDetailResponse {
  product: {
    id: string
    user_id: string
    title: string
    description: string
    category: string
    price: number
    condition: string
    location_city: string
    location_department: string
    images: string[]
    status: string
    views_count: number
    created_at: string
  }
  sellerProfile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    location_city: string | null
    location_department: string | null
    phone: string | null
    verification_level: number
  }
  businessProfile: {
    business_name: string | null
    slug: string | null
    social_whatsapp: string | null
  } | null
  isOwner: boolean
  currentUserId: string | null
  normalizedSellerContact: string | null
}

export function ProductDetailPageClient({ initialData }: ProductDetailPageClientProps) {
  const { product, sellerProfile, businessProfile, isOwner, normalizedSellerContact } = initialData
  const productPath = getProductPath(product.id)
  const categoryName = getCategoryName(product.category)
  const conditionLabel = CONDITION_LABELS[product.condition as keyof typeof CONDITION_LABELS]
  const location = formatProductLocationDisplay(product.location_city, product.location_department)
  const productImages = resolveProductImageUrls(product.images)
  const normalizedBusinessProfile =
    businessProfile?.business_name && businessProfile.slug
      ? {
          business_name: businessProfile.business_name,
          slug: businessProfile.slug,
          social_whatsapp: businessProfile.social_whatsapp,
        }
      : null
  const createdDate = new Date(product.created_at).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 overflow-hidden text-sm text-muted-foreground">
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
              <span className="block truncate text-foreground">{product.title}</span>
            </li>
          </ol>
        </nav>

        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Volver
        </Link>

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

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <ProductGallery images={productImages} productTitle={product.title} />

            <Card className="min-w-0 border-border/80 shadow-sm">
              <CardContent className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                <div>
                  <h1 className={productPresentation.detailTitle}>{product.title}</h1>
                  <p className={cn(productPresentation.detailPrice, 'mt-1')}>
                    Bs {product.price.toLocaleString('es-BO')}
                  </p>
                </div>

                <Separator />

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

                <div>
                  <h2 className={productPresentation.sectionHeading}>Descripción</h2>
                  <p className={productPresentation.sectionBody}>{product.description}</p>
                </div>

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <div className="flex w-full gap-2 sm:w-auto sm:flex-1 sm:justify-start">
                    <ShareButton
                      title={product.title}
                      className="flex-1 sm:min-w-[8rem] sm:flex-initial"
                    />
                    {!isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 sm:flex-initial"
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

          <div className="min-w-0 lg:col-span-1">
            <div className="min-w-0 sticky top-8">
              <SellerCard
                seller={sellerProfile}
                productTitle={product.title}
                business={normalizedBusinessProfile}
                hideContactActions={isOwner}
                productContact={
                  isOwner
                    ? undefined
                    : {
                        imageUrl: productImages[0] ?? null,
                        price: Number(product.price),
                        productPageUrl: absoluteUrl(productPath),
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
