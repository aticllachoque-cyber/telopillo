import { Card, CardContent } from '@/components/ui/card'
import { CtaStrip } from '@/components/home/CtaStrip'
import { HeroSearchForm } from '@/components/home/HeroSearchForm'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import Link from 'next/link'
import {
  MessageCircle,
  ChevronRight,
  Smartphone,
  MapPin,
  Megaphone,
  ShieldCheck,
  MoreHorizontal,
  Target,
  Search,
} from 'lucide-react'
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/data/categories'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Telopillo',
  url: BASE_URL,
  description: 'El marketplace 100% boliviano para comprar y vender de todo. Sin comisiones.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/buscar?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const HOMEPAGE_CATEGORY_IDS = [
  'electronics',
  'vehicles',
  'home',
  'fashion',
  'sports',
  'construction',
  'baby',
  'toys',
]

const features = [
  {
    Icon: Megaphone,
    title: 'Publicá Gratis',
    description: 'Sin costo ni comisiones. Llegá a compradores en toda Bolivia.',
  },
  {
    Icon: Search,
    title: 'Búsqueda Inteligente',
    description: 'Encontrá lo que buscás con filtros por ubicación, categoría y precio.',
  },
  {
    Icon: MessageCircle,
    title: 'Chat Directo',
    description: 'Hablá con compradores y vendedores en tiempo real.',
  },
  {
    Icon: Smartphone,
    title: 'Hecho para Celular',
    description: 'Optimizado para la mejor experiencia móvil en Bolivia.',
  },
]

export default function Home() {
  const categories = HOMEPAGE_CATEGORY_IDS.map((id) => {
    const cat = CATEGORIES.find((c) => c.id === id)
    return {
      id,
      name: cat?.name.split(' y ')[0] || cat?.name || id,
      Icon: CATEGORY_ICONS[id],
    }
  })

  return (
    <div className="min-h-dvh bg-background">
      <OnboardingGate />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30" aria-labelledby="hero-heading">
        <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20">
          <Card className="mx-auto max-w-4xl border border-border/60 bg-card shadow-md">
            <CardContent className="p-6 text-center sm:p-8">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <span>Marketplace 100% boliviano</span>
              </p>

              <h1
                id="hero-heading"
                className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Lo buscás, ¡te lo pillo!
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
                El marketplace boliviano para comprar y vender de todo. Gratis y seguro.
              </p>

              <HeroSearchForm />

              <p className="mt-6 text-center">
                <Link
                  href="/busco"
                  className="inline-flex min-h-[44px] touch-manipulation items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <Target className="size-4 shrink-0" aria-hidden />
                  <span className="text-pretty">¿Vendés? Encontrá qué buscan los compradores</span>
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="contenido-principal"
        className="py-16 md:py-20"
        aria-labelledby="categories-heading"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <h2
            id="categories-heading"
            className="text-center text-balance text-3xl font-bold sm:text-4xl"
          >
            Categorías populares
          </h2>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => {
              const IconComponent = category.Icon
              return (
                <Link
                  key={category.id}
                  href={`/buscar?category=${category.id}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-md transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div
                    className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                    aria-hidden
                  >
                    {IconComponent && <IconComponent className="size-6 text-primary" />}
                  </div>
                  <p className="text-pretty font-medium text-foreground group-hover:text-primary">
                    {category.name}
                  </p>
                </Link>
              )
            })}
            <Link
              href="/categorias"
              className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-md transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div
                className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                aria-hidden
              >
                <MoreHorizontal className="size-6 text-primary" />
              </div>
              <p className="text-pretty font-medium text-foreground group-hover:text-primary">
                Ver todas
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section
        className="border-y border-border/60 bg-muted/30 py-12 md:py-16"
        aria-labelledby="trust-heading"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <Card className="mx-auto max-w-5xl border border-border/60 shadow-md">
            <CardContent className="py-8 sm:py-10">
              <h2 id="trust-heading" className="sr-only">
                Datos de confianza
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl font-bold text-primary tabular-nums sm:text-4xl">
                    9
                  </span>
                  <span className="text-sm text-muted-foreground">Departamentos</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl font-bold text-primary tabular-nums sm:text-4xl">
                    0%
                  </span>
                  <span className="text-sm text-muted-foreground">Comisiones</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="size-7 text-primary sm:size-8" aria-hidden />
                  </div>
                  <span className="text-sm text-muted-foreground">Vendedores verificados</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl font-bold text-primary tabular-nums sm:text-4xl">
                    24/7
                  </span>
                  <span className="text-sm text-muted-foreground">Disponible siempre</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-6xl px-4">
          <h2
            id="features-heading"
            className="text-center text-balance text-3xl font-bold sm:text-4xl"
          >
            ¿Por qué Telopillo?
          </h2>

          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border border-border/60 shadow-md transition-shadow hover:shadow-md"
              >
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div
                    className="flex size-12 items-center justify-center rounded-xl bg-primary/10"
                    aria-hidden
                  >
                    <feature.Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-balance font-semibold">{feature.title}</h3>
                  <p className="text-pretty text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip - only shown to unauthenticated users */}
      <CtaStrip />
    </div>
  )
}
