import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CtaStrip } from '@/components/home/CtaStrip'
import { getHomepagePreview } from '@/lib/home/getHomepagePreview'
import { HeroSearchForm } from '@/components/home/HeroSearchForm'
import { ResilientHomePreview } from '@/components/home/ResilientHomePreview'
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
import { serializeJsonLd } from '@/lib/utils/json-ld'

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

export default async function Home() {
  const initialPreview = await getHomepagePreview()
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Hero Section */}
      {/* `dark` scopes the dark tokens so every child stays AA-legible on the charcoal tile */}
      <section
        className="dark relative isolate overflow-hidden bg-card text-foreground"
        aria-labelledby="hero-heading"
      >
        {/* Amber glow echoing the accent dot of the app icon */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_0%,color-mix(in_oklch,var(--brand)_24%,transparent),transparent)]"
          aria-hidden
        />
        <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-20 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 text-sm text-foreground">
              <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
              <span>Marketplace 100% boliviano</span>
            </p>

            <h1
              id="hero-heading"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Lo buscás, <span className="text-brand">¡te lo pillo!</span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              El marketplace boliviano para comprar y vender de todo. Gratis y seguro.
            </p>

            <HeroSearchForm />

            {/* Search is the hero's primary action (amber); publishing is amber in header (lg+) and FAB (<lg) */}
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                variant="outline"
                className="hidden min-h-[44px] touch-manipulation px-6 sm:inline-flex dark:border-foreground/30 dark:bg-foreground/10 dark:hover:bg-foreground/15"
              >
                <Link href="/crear" aria-label="Publicá gratis — sin costo ni comisiones">
                  <Megaphone className="size-4" aria-hidden />
                  Publicá gratis
                </Link>
              </Button>
              <Link
                href="/busco"
                className="inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Target className="size-4 shrink-0" aria-hidden />
                <span className="text-pretty">¿Vendés? Mirá qué buscan los compradores</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-20" aria-labelledby="categories-heading">
        <div className="container mx-auto max-w-6xl px-4">
          <h2
            id="categories-heading"
            className="text-center text-balance text-3xl font-bold sm:text-4xl"
          >
            Categorías populares
          </h2>

          <ul className="mx-auto mt-10 grid max-w-5xl list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
            {categories.map((category) => {
              const IconComponent = category.Icon
              return (
                <li key={category.id}>
                  <Link
                    href={`/buscar?category=${category.id}`}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl bg-brand-soft transition-colors group-hover:bg-brand"
                      aria-hidden
                    >
                      {IconComponent && (
                        <IconComponent className="size-6 text-brand-strong transition-colors group-hover:text-brand-foreground" />
                      )}
                    </div>
                    <p className="text-pretty font-medium text-foreground">{category.name}</p>
                  </Link>
                </li>
              )
            })}
            <li>
              <Link
                href="/categorias"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div
                  className="flex size-12 items-center justify-center rounded-xl bg-brand-soft transition-colors group-hover:bg-brand"
                  aria-hidden
                >
                  <MoreHorizontal className="size-6 text-brand-strong transition-colors group-hover:text-brand-foreground" />
                </div>
                <p className="text-pretty font-medium text-foreground">Ver todas</p>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <ResilientHomePreview initialData={initialPreview} />

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
                  <span className="text-3xl font-bold text-brand-strong tabular-nums sm:text-4xl">
                    9
                  </span>
                  <span className="text-sm text-muted-foreground">Departamentos</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl font-bold text-brand-strong tabular-nums sm:text-4xl">
                    0%
                  </span>
                  <span className="text-sm text-muted-foreground">Comisiones</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="size-7 text-brand-strong sm:size-8" aria-hidden />
                  </div>
                  <span className="text-sm text-muted-foreground">Vendedores verificados</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl font-bold text-brand-strong tabular-nums sm:text-4xl">
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
                    className="flex size-12 items-center justify-center rounded-xl bg-brand-soft"
                    aria-hidden
                  >
                    <feature.Icon className="size-6 text-brand-strong" />
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

      {/* Sticky publish CTA (approved iter.1) — mobile/tablet only; desktop uses header nav.
          Landing-only mount: /busco/[id] and publish wizards render their own bottom CTAs. */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <Button
          asChild
          variant="brand"
          size="lg"
          className="h-12 rounded-full px-6 text-sm font-semibold shadow-lg"
        >
          <Link
            href="/crear"
            id="publish-fab"
            aria-label="Publicá gratis — sin costo ni comisiones"
          >
            <Megaphone className="size-5" aria-hidden />
            Publicá gratis
          </Link>
        </Button>
      </div>
    </div>
  )
}
