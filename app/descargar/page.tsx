import type { Metadata } from 'next'
import Image from 'next/image'
import { Download, Globe, ListChecks, ShieldCheck, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const APK_PATH = '/app/telopillo-1.0.0.apk'
const APK_VERSION = '1.0.0'

export const metadata: Metadata = {
  title: 'Descargá la app para Android',
  description:
    'Instalá la app de Telopillo en tu Android: gratis, sin comisiones y 100% boliviana. Descarga directa del APK oficial.',
}

const INSTALL_STEPS = [
  {
    icon: Download,
    title: 'Descargá el archivo',
    description:
      'Tocá el botón "Descargar app". Se va a bajar un archivo llamado telopillo-1.0.0.apk (1 MB).',
  },
  {
    icon: ShieldCheck,
    title: 'Permití la instalación',
    description:
      'Android va a pedir permiso para instalar apps desde Chrome. Tocá "Permitir" en Ajustes y volvé atrás.',
  },
  {
    icon: Smartphone,
    title: 'Instalá y disfrutá',
    description:
      'Abrí el archivo descargado y tocá "Instalar". Si Play Protect pregunta, elegí "Instalar de todas formas": la app está firmada por Telopillo.',
  },
] as const

export default function DownloadPage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-8 p-8 text-center sm:p-10">
            {/* Hero */}
            <div className="space-y-4">
              <Smartphone className="mx-auto size-12 text-primary" aria-hidden />
              <h1 className="text-balance text-2xl font-bold sm:text-3xl">
                Descargá la app de Telopillo
              </h1>
              <p className="mx-auto max-w-md text-pretty text-muted-foreground">
                Gratis, sin comisiones y 100% boliviana. Instalala en tu Android en menos de un
                minuto.
              </p>
              <Button asChild size="lg" className="mt-2">
                <a href={APK_PATH} download={`telopillo-${APK_VERSION}.apk`}>
                  <Download className="size-5" aria-hidden />
                  Descargar app
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Versión {APK_VERSION} · 1 MB · Android 5.0 o superior
              </p>
            </div>

            {/* QR + steps */}
            <div className="grid gap-8 md:grid-cols-2 md:items-center md:text-left">
              {/* QR */}
              <figure className="mx-auto space-y-3">
                <div className="rounded-xl border bg-white p-4">
                  <Image
                    src="/icons/qr-descargar.png"
                    alt="Código QR para abrir esta página en tu celular"
                    width={220}
                    height={220}
                    className="size-[220px]"
                  />
                </div>
                <figcaption className="text-sm text-muted-foreground">
                  ¿Estás en una computadora? Escaneá el código con la cámara de tu celular para
                  abrir esta página ahí.
                </figcaption>
              </figure>

              {/* Steps */}
              <div className="space-y-5">
                <h2 className="flex items-center justify-center gap-2 text-lg font-semibold md:justify-start">
                  <ListChecks className="size-5 text-primary" aria-hidden />
                  Cómo instalar
                </h2>
                <ol className="space-y-5 text-left">
                  {INSTALL_STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-medium">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Web alternative */}
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/50 p-5 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-3">
              <Globe className="size-5 shrink-0" aria-hidden />
              <p>
                ¿Preferís no instalar nada? Telopillo funciona completo en tu navegador en{' '}
                <a href="https://www.telopillo.lat" className="font-medium text-primary underline">
                  telopillo.lat
                </a>
                , o agregalo a tu pantalla de inicio desde el menú de Chrome.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
