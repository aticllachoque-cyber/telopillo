import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Mensajes',
  description:
    'Chateá con compradores y vendedores en Telopillo. Coordiná entregas y consultas (próximamente).',
  openGraph: {
    title: 'Mensajes | Telopillo',
    description:
      'Pronto podrás enviar mensajes desde tu cuenta para coordinar compras en el marketplace boliviano.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function MensajesPage() {
  return (
    <div className="min-h-dvh bg-background py-10 sm:py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-6 p-8 text-center sm:p-10">
            <div className="flex justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-hidden
              >
                <MessageCircle className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">Mensajes</h1>
            <p className="mx-auto max-w-md text-pretty text-muted-foreground">
              El chat con compradores y vendedores estará disponible pronto. Podrás escribir desde
              aquí para coordinar compras y ventas.
            </p>
            <Button asChild variant="outline" className="mt-2 min-h-[44px] touch-manipulation">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
