import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Search,
  MessageCircle,
  ChevronRight,
  Smartphone,
  MapPin,
  Monitor,
  Car,
  Home as HomeIcon,
  Shirt,
  Sofa,
  Dumbbell,
  Wrench,
  MoreHorizontal,
  Upload,
} from 'lucide-react'

export default function Home() {
  const categories = [
    { name: 'Electrónica', slug: 'electronica', Icon: Monitor },
    { name: 'Vehículos', slug: 'vehiculos', Icon: Car },
    { name: 'Inmuebles', slug: 'inmuebles', Icon: HomeIcon },
    { name: 'Moda', slug: 'moda', Icon: Shirt },
    { name: 'Hogar', slug: 'hogar', Icon: Sofa },
    { name: 'Deportes', slug: 'deportes', Icon: Dumbbell },
    { name: 'Servicios', slug: 'servicios', Icon: Wrench },
    { name: 'Ver todas', slug: 'categorias', Icon: MoreHorizontal, isAllCategories: true },
  ]

  const features = [
    {
      Icon: Upload,
      title: 'Publicá Gratis',
      description: 'Sin costo. Llegá a compradores en toda Bolivia.',
    },
    {
      Icon: Search,
      title: 'Búsqueda Inteligente',
      description: 'Filtros por ubicación, categoría y precio.',
    },
    {
      Icon: MessageCircle,
      title: 'Chat Directo',
      description: 'Hablá con compradores y vendedores en tiempo real.',
    },
    {
      Icon: Smartphone,
      title: 'Hecho para Celular',
      description: 'Optimizado para la mejor experiencia móvil.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Skip link for accessibility */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido principal
      </a>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30" aria-labelledby="hero-heading">
        <div className="container px-4 py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust badge */}
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
              <MapPin className="size-4 text-primary" aria-hidden />
              <span>100% boliviano • Compra y vende en todo el país</span>
            </p>

            <h1
              id="hero-heading"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Lo que buscás, ¡telopillo!
            </h1>

            <p className="text-pretty mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Comprá y vendé de todo. Sin comisiones.
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
                    placeholder="Ej: iPhone, moto, departamento..."
                    className="h-12 pl-12 text-base"
                    aria-label="Término de búsqueda"
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8">
                  Buscar
                </Button>
              </div>
            </form>

            {/* Secondary CTA */}
            <div className="mt-6">
              <Button size="lg" variant="ghost" asChild>
                <Link href="/categorias" className="flex items-center gap-1">
                  Explorar categorías
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
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
              const href = category.isAllCategories ? '/categorias' : `/categorias/${category.slug}`
              return (
                <Link
                  key={category.name}
                  href={href}
                  className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div
                    className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                    aria-hidden
                  >
                    <IconComponent className="size-6 text-primary" />
                  </div>
                  <p className="text-pretty font-medium text-foreground group-hover:text-primary">
                    {category.name}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Merged features + trust */}
      <section className="border-y bg-muted/30 py-16 md:py-20" aria-labelledby="features-heading">
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

      {/* CTA Strip */}
      <section className="py-12 md:py-16" aria-labelledby="cta-heading">
        <div className="container px-4">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <h2 id="cta-heading" className="text-balance text-2xl font-bold sm:text-3xl">
              ¿Listo para empezar?
            </h2>
            <p className="text-pretty text-muted-foreground">
              Cuenta gratis en 2 minutos. Sin tarjeta. Sin compromisos.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Crear Cuenta Gratis</Link>
              </Button>
              <Link
                href="/login"
                className="rounded-sm px-2 py-1 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                ¿Ya tenés cuenta? Iniciá sesión
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
