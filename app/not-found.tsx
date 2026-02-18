import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscás no existe o fue movida.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-bold text-primary sm:text-8xl">404</p>

      <h1 className="mt-4 text-balance text-2xl font-bold sm:text-3xl">Página no encontrada</h1>

      <p className="mt-2 max-w-md text-pretty text-muted-foreground">
        La página que buscás no existe, fue movida o el enlace es incorrecto.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button asChild size="lg">
          <Link href="/" className="flex items-center gap-2">
            <Home className="size-4" aria-hidden />
            Ir al inicio
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/buscar" className="flex items-center gap-2">
            <Search className="size-4" aria-hidden />
            Buscar productos
          </Link>
        </Button>
      </div>
    </div>
  )
}
