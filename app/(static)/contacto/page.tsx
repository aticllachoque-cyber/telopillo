import type { Metadata } from 'next'
import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contactá al equipo de Telopillo para soporte, prensa o alianzas (formulario próximo).',
  openGraph: {
    title: 'Contacto | Telopillo',
    description: 'Escribinos desde Telopillo, el marketplace boliviano.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-4 p-8 text-center sm:p-10">
            <Construction className="mx-auto size-12 text-primary" aria-hidden />
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">Contacto</h1>
            <p className="mx-auto max-w-md text-pretty text-muted-foreground">
              Estamos preparando esta página. Pronto vas a poder contactarnos directamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
