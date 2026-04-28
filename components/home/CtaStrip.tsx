'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/providers/AuthProvider'

export function CtaStrip() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading || isAuthenticated) return null

  return (
    <section className="py-12 md:py-16" aria-labelledby="cta-heading">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="mx-auto max-w-2xl border border-border/60 shadow-md">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <h2 id="cta-heading" className="text-balance text-2xl font-bold sm:text-3xl">
              ¿Listo para empezar?
            </h2>
            <p className="text-pretty text-muted-foreground">
              Cuenta gratis en 2 minutos. Sin tarjeta. Sin compromisos.
            </p>
            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Button
                size="lg"
                className="min-h-[44px] w-full touch-manipulation sm:min-h-10 sm:w-auto"
                asChild
              >
                <Link href="/register">Crear cuenta gratis</Link>
              </Button>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-sm px-2 py-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:min-h-10"
              >
                ¿Ya tenés cuenta? Iniciá sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
