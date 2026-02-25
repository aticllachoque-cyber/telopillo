import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CtaStrip } from '@/components/home/CtaStrip'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import Link from 'next/link'
import {
  Search,
  MessageCircle,
  ChevronRight,
  Smartphone,
  MapPin,
  Megaphone,
  ShieldCheck,
  MoreHorizontal,
  Target,
} from 'lucide-react'
import { CATEGORIES, CATEGORY_ICONS } from '@/lib/data/categories'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo.bo'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Telopillo.bo',
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
    <div className="min-h-screen">
      <OnboardingGate />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30" aria-labelledby="hero-heading">
        <div className="container px-4 py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust badge */}
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
              <MapPin className="size-4 text-primary" aria-hidden />
              <span>Marketplace 100% boliviano</span>
            </p>

            <h1
              id="hero-heading"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Lo que buscás, ¡telopillo!
            </h1>

            <p className="text-pretty mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              El marketplace boliviano para comprar y vender de todo. Gratis y seguro.
            </p>

            {/* Primary CTA: Search bar */}
            <form
              action="/buscar"
              method="GET"
              className="mx-auto mt-8 max-w-2xl"
              role="search"
              aria-label="Buscar productos"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    name="q"
                    placeholder="Ej: iPhone, moto, muebles..."
                    className="h-12 pl-12 text-base"
                    aria-label="Término de búsqueda"
                    autoComplete="off"
                    required
                    maxLength={200}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8">
                  Buscar
                </Button>
              </div>
            </form>

            {/* Seller entry point */}
            <p className="mt-4 text-center">
              <Link
                href="/busco"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary min-h-[44px] py-2 touch-manipulation"
              >
                <Target className="size-4 shrink-0" aria-hidden />
                <span className="text-pretty">¿Vendés? Encontrá qué buscan los compradores</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="contenido-principal"
        className="py-16 md:py-20"
        aria-labelledby="categories-heading"
      >
        <div className="container px-4">
          <h2
            id="categories-heading"
            className="text-balance text-center text-3xl font-bold sm:text-4xl"
          >
            Categorías Populares
          </h2>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => {
              const IconComponent = category.Icon
              return (
                <Link
                  key={category.id}
                  href={`/buscar?category=${category.id}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
      <section className="border-y bg-muted/30 py-12 md:py-16" aria-labelledby="trust-heading">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            <h2 id="trust-heading" className="sr-only">
              Datos de confianza
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-bold text-primary sm:text-4xl">9</span>
                <span className="text-sm text-muted-foreground">Departamentos</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-bold text-primary sm:text-4xl">0%</span>
                <span className="text-sm text-muted-foreground">Comisiones</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="size-7 text-primary sm:size-8" aria-hidden />
                </div>
                <span className="text-sm text-muted-foreground">Vendedores verificados</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-bold text-primary sm:text-4xl">24/7</span>
                <span className="text-sm text-muted-foreground">Disponible siempre</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20" aria-labelledby="features-heading">
        <div className="container px-4">
          <h2
            id="features-heading"
            className="text-balance text-center text-3xl font-bold sm:text-4xl"
          >
            ¿Por qué Telopillo.bo?
          </h2>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center gap-3 text-center">
                <div
                  className="flex size-12 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <feature.Icon className="size-6 text-primary" />
                </div>
                <h3 className="text-balance font-semibold">{feature.title}</h3>
                <p className="text-pretty text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip - only shown to unauthenticated users */}
      <CtaStrip />
    </div>
  )
}
