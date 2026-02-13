import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Search,
  MessageCircle,
  Shield,
  Users,
  ChevronRight,
  Smartphone,
  Zap,
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

  const stats = [
    { value: '+50K', label: 'Usuarios activos' },
    { value: '+100K', label: 'Productos publicados' },
    { value: '9', label: 'Departamentos' },
  ]

  return (
    <div className="min-h-screen">
      {/* Skip link for accessibility */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido principal
      </a>

      {/* Hero Section - More engaging, search-focused */}
      <section
        className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background"
        aria-labelledby="hero-heading"
      >
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container px-4 py-16 sm:py-20 md:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust badge - mobile first */}
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              <span>100% boliviano • Compra y vende en todo el país</span>
            </p>

            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Lo que buscás,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                ¡telopillo!
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              El marketplace boliviano donde comprás y vendés de todo, fácil y rápido. Sin
              comisiones por publicar.
            </p>

            {/* Primary CTA: Search bar - key action for marketplace */}
            <form
              action="/buscar"
              method="GET"
              className="mx-auto mt-8 max-w-xl"
              role="search"
              aria-label="Buscar productos"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
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

            {/* Secondary CTAs */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" variant="outline" asChild>
                <Link href="/publicar" className="flex items-center gap-2">
                  <Upload className="h-5 w-5" aria-hidden />
                  Publicar Gratis
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/categorias" className="flex items-center gap-1">
                  Explorar categorías
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>

            {/* Social proof stats */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Improved hierarchy and icons */}
      <section
        id="contenido-principal"
        className="border-y bg-muted/30 py-16 md:py-20"
        aria-labelledby="features-heading"
      >
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-heading" className="text-3xl font-bold sm:text-4xl">
              ¿Por qué Telopillo.bo?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Diseñado para bolivianos, pensado para vos
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-0 bg-card shadow-md transition-shadow hover:shadow-lg">
              <CardHeader className="space-y-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Publicá Gratis</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Publicá tus productos sin costo y llegá a miles de compradores en toda Bolivia
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-card shadow-md transition-shadow hover:shadow-lg">
              <CardHeader className="space-y-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Búsqueda Inteligente</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Encontrá lo que buscás rápido con nuestra búsqueda avanzada y filtros por
                    ubicación
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-card shadow-md transition-shadow hover:shadow-lg">
              <CardHeader className="space-y-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Chat Directo</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Hablá directamente con vendedores y compradores de forma segura y en tiempo real
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section - Icons, better touch targets */}
      <section className="py-16 md:py-20" aria-labelledby="categories-heading">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="categories-heading" className="text-3xl font-bold sm:text-4xl">
              Categorías Populares
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Encontrá lo que necesitás en segundos
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
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
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                    aria-hidden
                  >
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground group-hover:text-primary">
                    {category.name}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust & Mobile Section */}
      <section className="border-y bg-muted/30 py-16 md:py-20" aria-labelledby="trust-heading">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            <h2 id="trust-heading" className="text-3xl font-bold text-center mb-12">
              Por qué confiar en Telopillo.bo
            </h2>
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              <div className="flex gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Hecho para tu celular</h3>
                  <p className="mt-2 text-muted-foreground">
                    La mayoría de nuestros usuarios compran y venden desde el celular. Nuestra app
                    web está optimizada para que tengas la mejor experiencia en pantalla chica.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10"
                  aria-hidden
                >
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Comprá y vendé con confianza</h3>
                  <p className="mt-2 text-muted-foreground">
                    Chat directo con vendedores, perfiles verificables y una comunidad activa.
                    Siempre podés reportar si algo no cuadra.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Stronger, more compelling */}
      <section className="py-16 md:py-24" aria-labelledby="cta-heading">
        <div className="container px-4">
          <Card className="mx-auto max-w-2xl overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl">
            <CardHeader className="space-y-4 text-center">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
                aria-hidden
              >
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <CardTitle id="cta-heading" className="text-2xl sm:text-3xl">
                ¿Listo para empezar?
              </CardTitle>
              <CardDescription className="text-base">
                Creá tu cuenta gratis en menos de 2 minutos. Sin tarjeta de crédito. Sin
                compromisos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pb-8">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/register">Crear Cuenta Gratis</Link>
              </Button>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" aria-hidden />
                Únete a miles de bolivianos que ya compran y venden en Telopillo
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1"
              >
                ¿Ya tenés cuenta? Iniciá sesión
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
