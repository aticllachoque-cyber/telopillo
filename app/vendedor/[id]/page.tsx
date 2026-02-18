import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SellerProfileHeader } from '@/components/profile/SellerProfileHeader'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Package } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SellerPageProps {
  params: {
    id: string
  }
}

interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  location_city: string | null
  location_department: string | null
  phone: string | null
  verification_level: number
  rating_average: number | null
  rating_count: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Data Fetching
// ---------------------------------------------------------------------------

async function getSellerProfile(id: string) {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, avatar_url, location_city, location_department, phone, verification_level, rating_average, rating_count, created_at'
    )
    .eq('id', id)
    .single()

  if (error || !profile) return null
  return profile as SellerProfile
}

async function getBusinessSlug(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('business_profiles').select('slug').eq('id', userId).single()

  return data?.slug ?? null
}

async function getSellerProducts(userId: string) {
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

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getSellerProfile(id)

  if (!profile) {
    return { title: 'Vendedor no encontrado - Telopillo.bo' }
  }

  const name = profile.full_name || 'Vendedor'
  const location = [profile.location_city, profile.location_department].filter(Boolean).join(', ')
  const description = location
    ? `Perfil de ${name} en Telopillo.bo. Vendedor ubicado en ${location}. Encuentra sus productos disponibles.`
    : `Perfil de ${name} en Telopillo.bo. Encuentra sus productos disponibles.`

  return {
    title: `${name} - Vendedor en Telopillo.bo`,
    description,
    openGraph: {
      title: `${name} - Vendedor en Telopillo.bo`,
      description,
      type: 'profile',
      ...(profile.avatar_url && { images: [profile.avatar_url] }),
    },
    twitter: {
      card: 'summary',
      title: `${name} - Vendedor en Telopillo.bo`,
      description,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://telopillo.bo'}/vendedor/${id}`,
    },
  }
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

function buildJsonLd(profile: SellerProfile, productCount: number) {
  const location = [profile.location_city, profile.location_department].filter(Boolean).join(', ')

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name || 'Vendedor',
    ...(profile.avatar_url && { image: profile.avatar_url }),
    ...(location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.location_city || undefined,
        addressRegion: profile.location_department || undefined,
        addressCountry: 'BO',
      },
    }),
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'ItemList',
        numberOfItems: productCount,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function SellerProfilePage({ params }: SellerPageProps) {
  const { id } = await params

  const [profile, businessSlug, products] = await Promise.all([
    getSellerProfile(id),
    getBusinessSlug(id),
    getSellerProducts(id),
  ])

  if (!profile) {
    notFound()
  }

  const jsonLd = buildJsonLd(profile, products.length)

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
        <div className="container max-w-6xl px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] py-2 text-sm text-muted-foreground hover:text-foreground mb-6 touch-manipulation"
          >
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Volver
          </Link>

          {/* Seller Header */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <SellerProfileHeader
                profile={profile}
                businessSlug={businessSlug}
                productCount={products.length}
              />
            </CardContent>
          </Card>

          {/* Products Section */}
          <section>
            <h2 className="text-xl font-semibold mb-6">
              Productos de {profile.full_name || 'este vendedor'}
              {products.length > 0 && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  ({products.length})
                </span>
              )}
            </h2>

            {products.length > 0 ? (
              <ProductGrid products={products} showActions={false} showStatusBadge={false} />
            ) : (
              <Card>
                <CardContent
                  className="flex flex-col items-center justify-center py-16 text-center"
                  role="status"
                >
                  <Package className="size-12 text-muted-foreground/40 mb-4" aria-hidden />
                  <h3 className="text-lg font-semibold mb-2">Sin productos publicados</h3>
                  <p className="text-muted-foreground max-w-md">
                    Este vendedor aún no tiene productos disponibles. Vuelve a consultar más
                    adelante.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
