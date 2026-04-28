import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscás no existe o fue movida.',
  openGraph: {
    title: '404 — Página no encontrada | Telopillo',
    description: 'El enlace puede estar roto o la página fue movida.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-lg px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-6 p-8 text-center sm:p-10">
            <p className="text-6xl font-bold text-primary sm:text-7xl" aria-hidden>
              404
            </p>
            <div>
              <h1 className="text-balance text-2xl font-bold sm:text-3xl">Página no encontrada</h1>
              <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
                La página que buscás no existe, fue movida o el enlace es incorrecto.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button asChild size="lg" className="min-h-[44px] touch-manipulation">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="size-4" aria-hidden />
                  Ir al inicio
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-[44px] touch-manipulation"
              >
                <Link href="/buscar" className="flex items-center justify-center gap-2">
                  <Search className="size-4" aria-hidden />
                  Buscar productos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
