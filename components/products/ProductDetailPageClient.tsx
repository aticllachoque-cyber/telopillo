'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SellerCard } from '@/components/products/SellerCard'
import { ProductActions } from '@/components/products/ProductActions'
import { ShareButton } from '@/components/products/ShareButton'
import { ProductWhatsAppLink } from '@/components/products/ProductWhatsAppLink'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { OwnerListingNotice } from '@/components/products/OwnerListingNotice'
import { ArrowLeft, Eye, Flag, Calendar, MapPin, Tag, CheckCircle2 } from 'lucide-react'
import { productPresentation } from '@/lib/constants/productPresentation'
import { cn, absoluteUrl } from '@/lib/utils'
import { CONDITION_LABELS, formatProductLocationDisplay } from '@/lib/validations/product'
import { getCategoryName } from '@/lib/data/categories'
import { getProductPath } from '@/lib/utils/publicRoutes'
import { resolveProductImageUrls } from '@/lib/utils/image'
import {
  buildProductWhatsAppPrefillMessage,
  buildWhatsAppMeUrl,
  resolveSellerWhatsAppDigits,
} from '@/lib/utils/whatsapp'

interface RelatedProduct {
  id: string
  title: string
  price: number
  location_city: string | null
  location_department: string | null
  images: string[]
}

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
  relatedProducts?: RelatedProduct[]
}

const REPORT_REASONS = [
  { value: 'prohibited', label: 'Producto prohibido' },
  { value: 'scam', label: 'Fraude o estafa' },
  { value: 'misleading', label: 'Información falsa o engañosa' },
  { value: 'sold', label: 'El producto ya fue vendido' },
  { value: 'other', label: 'Otro motivo' },
] as const

type ReportStatus = 'idle' | 'sent'

export function ProductDetailPageClient({ initialData }: ProductDetailPageClientProps) {
  const router = useRouter()
  const { product, sellerProfile, businessProfile, isOwner, normalizedSellerContact } = initialData
  const relatedProducts = initialData.relatedProducts ?? []
  const productPath = getProductPath(product.id, product.title)
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

  // Report dialog state (F-2: "Reportar" must have a real affordance)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0].value)
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle')

  // Buyer-only compact mobile CTA (F-1: contact action surfaced near the top on mobile)
  const sellerContact = isOwner
    ? null
    : resolveSellerWhatsAppDigits(
        normalizedBusinessProfile?.social_whatsapp ?? null,
        sellerProfile.phone
      )
  const compactDigits = sellerContact?.normalizedDigits ?? null
  const canWhatsAppCompact = compactDigits != null
  const compactWhatsAppHref = compactDigits
    ? buildWhatsAppMeUrl(
        compactDigits,
        buildProductWhatsAppPrefillMessage({
          productTitle: product.title,
          price: Number(product.price),
          productAbsoluteUrl: absoluteUrl(productPath),
        })
      )
    : null

  const handleBack = () => {
    // F-6: preserve navigation context — return to where the user came from
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
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
                <Link
                  href={`/buscar?category=${product.category}`}
                  className="hover:text-foreground"
                >
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
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex shrink-0 items-center text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver
          </button>
        </div>

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
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <h1 className={cn(productPresentation.detailTitle, 'min-w-0 flex-1')}>
                    {product.title}
                  </h1>
                  <p className={cn(productPresentation.detailPrice, 'sm:text-right')}>
                    Bs {product.price.toLocaleString('es-BO')}
                  </p>
                </div>

                <Separator />

                <ul
                  className="m-0 grid list-none gap-3 rounded-lg border border-border/80 bg-muted/30 p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
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

                {/* Compact price + contact CTA near the top on mobile (F-1) */}
                {!isOwner && canWhatsAppCompact && compactWhatsAppHref && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 p-3 lg:hidden">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className={cn(productPresentation.sellerPreviewPrice, 'text-lg')}>
                        Bs {product.price.toLocaleString('es-BO')}
                      </p>
                    </div>
                    <ProductWhatsAppLink
                      href={compactWhatsAppHref}
                      ariaLabel={`Contactar a ${sellerProfile.full_name || 'vendedor'} por WhatsApp sobre ${product.title}`}
                      label="Contactar WhatsApp"
                      fullWidth={false}
                      className="shrink-0"
                    />
                  </div>
                )}

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
                      shareText={`Mira esta publicación: ${product.title} por Bs ${product.price.toLocaleString('es-BO')}`}
                      className="flex-1 sm:min-w-[8rem] sm:flex-initial"
                    />
                    {!isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 sm:flex-initial"
                        onClick={() => {
                          setReportStatus('idle')
                          setReportOpen(true)
                        }}
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

        {/* Related products: same category, minimal marketplace card (approved iteration 3) */}
        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-products-heading" className="mt-12">
            <h2
              id="related-products-heading"
              className="mb-4 text-lg font-bold tracking-tight text-foreground sm:text-xl"
            >
              Productos relacionados
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const itemImages = resolveProductImageUrls(item.images)
                return (
                  <li key={item.id} className="min-w-0">
                    <Link
                      href={getProductPath(item.id, item.title)}
                      className="group block h-full overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        {itemImages[0] ? (
                          <Image
                            src={itemImages[0]}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-muted-foreground"
                            aria-hidden
                          >
                            Sin imagen
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground">
                          {item.title}
                        </p>
                        <p className="text-base font-bold tabular-nums text-primary">
                          Bs {item.price.toLocaleString('es-BO')}
                        </p>
                        <p className={productPresentation.locationRow}>
                          <MapPin className={productPresentation.locationIcon} aria-hidden />
                          <span className="truncate">
                            {formatProductLocationDisplay(
                              item.location_city ?? '',
                              item.location_department ?? ''
                            )}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Report dialog (F-2): real affordance for the "Reportar" action */}
      {!isOwner && (
        <AlertDialog
          open={reportOpen}
          onOpenChange={(open) => {
            setReportOpen(open)
            if (!open) setReportStatus('idle')
          }}
        >
          <AlertDialogContent>
            {reportStatus === 'idle' ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reportar publicación</AlertDialogTitle>
                  <AlertDialogDescription>
                    Contanos qué está pasando con «{product.title}». Nuestro equipo revisará tu
                    reporte.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <RadioGroup
                  value={reportReason}
                  onValueChange={setReportReason}
                  className="gap-3"
                  aria-label="Motivo del reporte"
                >
                  {REPORT_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center gap-3">
                      <RadioGroupItem value={reason.value} id={`report-reason-${reason.value}`} />
                      <Label
                        htmlFor={`report-reason-${reason.value}`}
                        className="cursor-pointer font-normal"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => setReportStatus('sent')}
                    className="min-h-[44px]"
                  >
                    Enviar reporte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                    Reporte enviado
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Gracias por ayudar a mantener Telopillo seguro. Revisaremos esta publicación lo
                    antes posible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setReportOpen(false)} className="min-h-[44px]">
                    Cerrar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
