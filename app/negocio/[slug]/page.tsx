import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BusinessHeader } from '@/components/business/BusinessHeader'
import { BusinessInfoSidebar } from '@/components/business/BusinessInfoSidebar'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Construction, Package, Store } from 'lucide-react'
import { absoluteUrl } from '@/lib/utils'

interface StorefrontPageProps {
  params: Promise<{
    slug: string
  }>
}

// ---------------------------------------------------------------------------
// Data fetching (shared by generateMetadata and page)
// ---------------------------------------------------------------------------

async function getBusinessBySlug(slug: string) {
  const supabase = await createClient()

  // Fetch business profile with its owner profile in a single query
  const { data: business, error } = await supabase
    .from('business_profiles')
    .select(
      `
      *,
      profiles:id (
        id,
        full_name,
        avatar_url,
        phone,
        verification_level,
        created_at
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (error || !business) return null
  return business
}

async function getBusinessProducts(userId: string) {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select(
      'id, title, price, images, status, location_city, location_department, views_count, created_at'
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return products ?? []
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
  const imageUrl = business.business_logo_url || '/og-image.png'
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
  storefrontUrl: string
) {
  const profile = business.profiles as {
    id: string
    full_name: string
    phone: string | null
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.business_name,
    url: storefrontUrl,
  }

  if (business.business_description) {
    jsonLd.description = business.business_description
  }
  if (business.business_logo_url) {
    jsonLd.image = business.business_logo_url
  }
  if (profile?.phone) {
    jsonLd.telephone = profile.phone
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

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)

  if (!business) {
    notFound()
  }

  const profile = business.profiles as {
    id: string
    full_name: string
    avatar_url: string | null
    phone: string | null
    verification_level: number
    created_at: string
  }

  const products = await getBusinessProducts(profile.id)

  const jsonLd = buildJsonLd(business, absoluteUrl(`/negocio/${slug}`))

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20 py-8">
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

          {/* MVP: set expectations — storefronts are still being enriched */}
          <div
            className="mb-6 flex gap-3 rounded-xl border border-primary/35 bg-gradient-to-br from-primary/12 via-primary/5 to-amber-500/10 px-4 py-3 shadow-sm sm:px-5 sm:py-4"
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                Estamos ayudando a este negocio a completar su vitrina: datos, horarios y catálogo
                pueden ir sumándose. Si ves algo que te interesa, contactá al vendedor — así les das
                una mano a seguir mejorando.
              </p>
            </div>
          </div>

          {/* Header Card */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <BusinessHeader business={business} profile={profile} />
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
                  phone={profile.phone}
                />
              </div>
            </div>

            {/* Products */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Package className="size-5" aria-hidden="true" />
                  Productos
                  {products.length > 0 && (
                    <span className="text-base font-normal text-muted-foreground">
                      ({products.length})
                    </span>
                  )}
                </h2>
              </div>

              {products.length > 0 ? (
                <ProductGrid products={products} showActions={false} />
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
