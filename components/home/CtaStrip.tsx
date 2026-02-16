'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/AuthProvider'

export function CtaStrip() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading || isAuthenticated) return null

  return (
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
  )
}
