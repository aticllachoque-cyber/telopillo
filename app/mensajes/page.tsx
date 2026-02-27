import Link from 'next/link'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Mensajes - Telopillo.bo',
  description: 'Chat con compradores y vendedores. Próximamente.',
}

export default function MensajesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <MessageCircle className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-balance">Mensajes</h1>
          <p className="text-muted-foreground">
            El chat con compradores y vendedores estará disponible pronto. Podrás escribir desde
            aquí para coordinar compras y ventas.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
