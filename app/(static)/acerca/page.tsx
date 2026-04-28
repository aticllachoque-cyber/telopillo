import type { Metadata } from 'next'
import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Acerca de',
  description:
    'Telopillo es el marketplace boliviano para comprar y vender: conocé la historia y el equipo (contenido próximo).',
  openGraph: {
    title: 'Acerca de | Telopillo',
    description: 'Marketplace 100% boliviano para comprar y vender de forma simple y segura.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-4 p-8 text-center sm:p-10">
            <Construction className="mx-auto size-12 text-primary" aria-hidden />
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">Acerca de</h1>
            <p className="mx-auto max-w-md text-pretty text-muted-foreground">
              Estamos preparando esta página. Pronto vas a poder conocer más sobre Telopillo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
