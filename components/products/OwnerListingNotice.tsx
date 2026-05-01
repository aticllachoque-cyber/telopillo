import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface OwnerListingNoticeProps {
  /** True when business WhatsApp or profile phone normalizes for wa.me */
  hasBuyerContactConfigured: boolean
}

/**
 * Explains why WhatsApp CTAs are hidden when the listing owner views their own product,
 * and how to preview the public (buyer) view.
 */
export function OwnerListingNotice({ hasBuyerContactConfigured }: OwnerListingNoticeProps) {
  return (
    <Card className="mb-6 border-primary/25 bg-primary/5 shadow-none">
      <CardContent className="flex gap-3 pt-4 pb-4">
        <div className="shrink-0 pt-0.5" aria-hidden>
          <Info className="size-5 text-primary" />
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="font-semibold text-foreground">Este es tu producto</p>
          {hasBuyerContactConfigured ? (
            <p className="text-muted-foreground leading-relaxed">
              Los compradores ven el botón para escribirte por WhatsApp con un mensaje que ya
              incluye el enlace a esta publicación. Por eso no ves ese botón mientras estás con tu
              cuenta.
            </p>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              Configura un número válido en tu perfil o en WhatsApp del negocio para que aparezca el
              contacto a los compradores.
            </p>
          )}
          <p className="text-muted-foreground leading-relaxed">
            Para ver la página como la ven otros, ábrela en una{' '}
            <strong className="font-medium text-foreground">ventana privada</strong> o sin iniciar
            sesión.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
