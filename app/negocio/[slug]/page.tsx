import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createPublicClient } from '@/lib/supabase/server'
import { BusinessHeader } from '@/components/business/BusinessHeader'
import { BusinessInfoSidebar } from '@/components/business/BusinessInfoSidebar'
import { ProductGrid } from '@/components/products/ProductGrid'
import { SearchSort } from '@/components/search/SearchSort'
import { Card, CardContent } from '@/components/ui/card'
import { Construction, Package, Store } from 'lucide-react'
import { absoluteUrl } from '@/lib/utils'
import { resolveBusinessLogoUrl } from '@/lib/utils/image'
import { serializeJsonLd } from '@/lib/utils/json-ld'

interface StorefrontPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    sort?: string
    page?: string
  }>
}

const PAGE_SIZE = 12
const STOREFRONT_SORTS = ['newest', 'price_asc', 'price_desc'] as const
type StorefrontSort = (typeof STOREFRONT_SORTS)[number]

function parseSort(value: string | undefined): StorefrontSort {
  return STOREFRONT_SORTS.includes(value as StorefrontSort) ? (value as StorefrontSort) : 'newest'
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

/** URL for a storefront page; omits defaults so canonical stays clean. */
function storefrontHref(slug: string, sort: StorefrontSort, page: number) {
  const params = new URLSearchParams()
  if (sort !== 'newest') params.set('sort', sort)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return `/negocio/${slug}${qs ? `?${qs}` : ''}`
}

// ---------------------------------------------------------------------------
// Data fetching (shared by generateMetadata and page)
// ---------------------------------------------------------------------------

async function getBusinessBySlug(slug: string) {
  const supabase = createPublicClient()

  const { data: business, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !business) return null
  return business
}

async function getBusinessProducts(userId: string, sort: StorefrontSort, requestedPage: number) {
  const supabase = createPublicClient()

  const select =
    'id, title, price, images, status, condition, location_city, location_department, views_count, created_at'

  const fetchPage = async (page: number) => {
    let query = supabase
      .from('products')
      .select(select, { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * PAGE_SIZE
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1)
    return { products: data ?? [], total: count ?? 0, page }
  }

  let result = await fetchPage(requestedPage)

  // Out-of-range page (stale link) → clamp to last page instead of rendering empty
  if (result.products.length === 0 && requestedPage > 1 && result.total > 0) {
    const lastPage = Math.ceil(result.total / PAGE_SIZE)
    result = await fetchPage(Math.min(requestedPage, lastPage))
  }

  return result
}

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business) {
    return { title: 'Negocio no encontrado - Telopillo' }
  }

  const title = business.business_name
  const description = business.business_description
    ? business.business_description.slice(0, 160)
    : `Visita la tienda de ${business.business_name} en Telopillo. Encuentra sus productos y ofertas.`
  const imageUrl = resolveBusinessLogoUrl(business.business_logo_url) || '/og-image.png'
  const canonicalPath = `/negocio/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: business.business_name,
      description,
      images: [imageUrl],
      type: 'website',
      url: absoluteUrl(canonicalPath),
      siteName: 'Telopillo',
    },
    twitter: {
      card: 'summary_large_image',
      title: business.business_name,
      description,
      images: [imageUrl],
    },
  }
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

function buildJsonLd(
  business: NonNullable<Awaited<ReturnType<typeof getBusinessBySlug>>>,
  storefrontUrl: string,
  contactPhone: string | null
) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.business_name,
    url: storefrontUrl,
  }

  if (business.business_description) {
    jsonLd.description = business.business_description
  }
  const businessLogoUrl = resolveBusinessLogoUrl(business.business_logo_url)
  if (businessLogoUrl) {
    jsonLd.image = businessLogoUrl
  }
  if (contactPhone) {
    jsonLd.telephone = contactPhone
  }
  if (business.business_address || business.business_city) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      addressLocality: business.business_city || undefined,
      addressRegion: business.business_department || undefined,
      streetAddress: business.business_address || undefined,
      addressCountry: 'BO',
    }
  }
  if (business.website_url) {
    jsonLd.sameAs = [
      business.website_url,
      business.social_facebook,
      business.social_instagram,
      business.social_tiktok,
    ].filter(Boolean)
  }

  return jsonLd
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function StorefrontPage({ params, searchParams }: StorefrontPageProps) {
  const { slug } = await params
  const sp = await searchParams
  const sort = parseSort(sp.sort)
  const requestedPage = parsePage(sp.page)
  const supabase = createPublicClient()
  const business = await getBusinessBySlug(slug)

  if (!business) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles_public')
    .select('id, full_name, avatar_url, verification_level, created_at')
    .eq('id', business.id)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const { data: sellerContactPhone } = await supabase.rpc('get_seller_contact_phone', {
    p_user_id: profile.id,
  })

  const contactPhone =
    typeof sellerContactPhone === 'string' && sellerContactPhone.trim()
      ? sellerContactPhone.trim()
      : null

  const { products, total, page } = await getBusinessProducts(profile.id, sort, requestedPage)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const jsonLd = buildJsonLd(business, absoluteUrl(`/negocio/${slug}`), contactPhone)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="min-h-dvh bg-background py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center min-h-[44px] py-2 hover:text-foreground touch-manipulation"
                >
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">
                <span className="text-foreground truncate">{business.business_name}</span>
              </li>
            </ol>
          </nav>

          {/* MVP: set expectations — only while the storefront has no catalog yet */}
          {total === 0 && (
            <div
              className="mb-6 flex gap-3 rounded-xl border border-primary/35 bg-muted/40 px-4 py-3 shadow-sm sm:px-5 sm:py-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm ring-1 ring-primary/20">
                <Construction className="size-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  Tienda en construcción en Telopillo
                </p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  Estamos ayudando a este negocio a completar su vitrina: datos, horarios y catálogo
                  pueden ir sumándose. Si ves algo que te interesa, contactá al vendedor — así les
                  das una mano a seguir mejorando.
                </p>
              </div>
            </div>
          )}

          {/* Header Card */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <BusinessHeader business={business} profile={{ ...profile, phone: contactPhone }} />
            </CardContent>
          </Card>

          {/* Main Content: Products + Sidebar */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Sidebar — first on mobile so contact CTAs appear before products */}
            <div className="order-1 lg:order-2 lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <BusinessInfoSidebar
                  business={{
                    business_hours: business.business_hours as Record<string, string> | null,
                    business_address: business.business_address,
                    business_department: business.business_department,
                    business_city: business.business_city,
                    website_url: business.website_url,
                    social_facebook: business.social_facebook,
                    social_instagram: business.social_instagram,
                    social_tiktok: business.social_tiktok,
                    social_whatsapp: business.social_whatsapp,
                  }}
                  phone={contactPhone}
                />
              </div>
            </div>

            {/* Products */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Package className="size-5" aria-hidden="true" />
                  Productos
                  {total > 0 && (
                    <span className="text-base font-normal text-muted-foreground">({total})</span>
                  )}
                </h2>
                {total > 0 && (
                  <Suspense fallback={null}>
                    <SearchSort
                      pathname={`/negocio/${slug}`}
                      defaultSort="newest"
                      options={STOREFRONT_SORTS}
                      showLabel={false}
                      className="min-w-0 sm:w-auto"
                    />
                  </Suspense>
                )}
              </div>

              {products.length > 0 ? (
                <>
                  <ProductGrid products={products} showActions={false} />
                  {totalPages > 1 && (
                    <nav
                      aria-label="Paginación de productos"
                      className="flex items-center justify-between gap-3 pt-2"
                    >
                      {page > 1 ? (
                        <Link
                          href={storefrontHref(slug, sort, page - 1)}
                          className="inline-flex min-h-[44px] touch-manipulation items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                          rel="prev"
                        >
                          ← Anterior
                        </Link>
                      ) : (
                        <span aria-hidden="true" className="w-28" />
                      )}
                      <span
                        className="text-sm text-muted-foreground tabular-nums"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        Página {page} de {totalPages}
                      </span>
                      {page < totalPages ? (
                        <Link
                          href={storefrontHref(slug, sort, page + 1)}
                          className="inline-flex min-h-[44px] touch-manipulation items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                          rel="next"
                        >
                          Siguiente →
                        </Link>
                      ) : (
                        <span aria-hidden="true" className="w-28" />
                      )}
                    </nav>
                  )}
                </>
              ) : (
                /* Empty storefront */
                <Card>
                  <CardContent
                    className="flex flex-col items-center justify-center py-16 text-center"
                    role="status"
                  >
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Store className="size-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Sin productos publicados</h3>
                    <p className="text-muted-foreground max-w-sm mb-4">
                      Este negocio aún no tiene productos publicados. Vuelve pronto para ver sus
                      ofertas.
                    </p>
                    <Link
                      href={`/vendedor/${profile.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Ver perfil del vendedor →
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
