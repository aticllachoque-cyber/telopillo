import type { Metadata } from 'next'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Static so the service worker can precache it at install time.
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Sin conexión',
  description: 'No pudimos cargar Telopillo porque no tenés internet.',
  robots: { index: false },
}

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-4 p-8 text-center sm:p-10">
            <WifiOff className="mx-auto size-12 text-primary" aria-hidden />
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">Sin conexión</h1>
            <p className="mx-auto max-w-md text-pretty text-muted-foreground">
              No pudimos cargar Telopillo porque no tenés internet. Revisá tu conexión y volvé a
              intentar.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Reintentar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
