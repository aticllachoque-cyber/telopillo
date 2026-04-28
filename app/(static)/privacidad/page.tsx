import type { Metadata } from 'next'
import { Construction } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Privacidad',
  description:
    'Política de privacidad de Telopillo: tratamiento de datos personales en el marketplace boliviano (texto legal próximo).',
  openGraph: {
    title: 'Política de privacidad | Telopillo',
    description: 'Cómo protegemos y usamos tus datos en Telopillo.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-4 p-8 text-center sm:p-10">
            <Construction className="mx-auto size-12 text-primary" aria-hidden />
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">Privacidad</h1>
            <p className="mx-auto max-w-md text-pretty text-muted-foreground">
              Estamos preparando esta página. Pronto vas a poder leer nuestra política de
              privacidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
