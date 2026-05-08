import Link from 'next/link'
import { ArrowLeft, ChevronRight, Package, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const publishOptions = [
  {
    href: '/publicar',
    eyebrow: 'Quiero vender',
    title: 'Publicar un producto',
    description:
      'Subí fotos, definí precio y publicá lo que ofrecés para empezar a recibir mensajes de compradores.',
    cta: 'Ir a publicar producto',
    Icon: Package,
  },
  {
    href: '/busco/publicar',
    eyebrow: 'Estoy buscando',
    title: 'Publicar lo que busco',
    description:
      'Contá qué necesitás y dejá que vendedores te contacten con ofertas y propuestas concretas.',
    cta: 'Ir a publicar solicitud',
    Icon: Target,
  },
]

export default function CrearPage() {
  return (
    <div className="min-h-dvh bg-background py-4 sm:py-12">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al inicio
        </Link>

        <div className="mx-auto mt-3 max-w-3xl text-center sm:mt-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary sm:text-sm">
            Publicar en Telopillo
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:mt-3 sm:text-5xl">
            ¿Qué querés publicar?
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm text-muted-foreground sm:mt-4 sm:text-lg">
            Podés vender un producto o publicar lo que necesitás para recibir ofertas. Elegí el
            camino que mejor encaje con tu intención.
          </p>
        </div>

        <div className="mt-5 space-y-3 sm:mt-10 sm:hidden">
          {publishOptions.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="block rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <option.Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
                    {option.eyebrow}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-tight">{option.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 hidden gap-5 md:grid-cols-2 sm:grid">
          {publishOptions.map((option) => (
            <Card key={option.href} className="border-border/70 shadow-md">
              <CardContent className="flex h-full flex-col p-7">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <option.Icon className="size-6" aria-hidden />
                </div>
                <p className="mt-5 text-sm font-medium uppercase tracking-wide text-primary/80">
                  {option.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{option.title}</h2>
                <p className="mt-3 flex-1 text-pretty text-muted-foreground">
                  {option.description}
                </p>
                <Button asChild className="mt-6 min-h-[44px] w-full sm:w-auto">
                  <Link href={option.href}>{option.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
