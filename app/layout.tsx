import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Telopillo.bo - Comprar y Vender en Bolivia | Marketplace Boliviano',
    template: '%s | Telopillo.bo',
  },
  description:
    'El marketplace 100% boliviano para comprar y vender de todo. Sin comisiones. Electrónica, vehículos, moda y más en los 9 departamentos de Bolivia.',
  keywords: [
    'comprar',
    'vender',
    'Bolivia',
    'marketplace',
    'clasificados',
    'telopillo',
    'La Paz',
    'Santa Cruz',
    'Cochabamba',
    'gratis',
  ],
  authors: [{ name: 'Telopillo.bo' }],
  creator: 'Telopillo.bo',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo.bo'),
  openGraph: {
    type: 'website',
    locale: 'es_BO',
    siteName: 'Telopillo.bo',
    title: 'Telopillo.bo - Comprar y Vender en Bolivia',
    description:
      'El marketplace 100% boliviano. Comprá y vendé de todo sin comisiones en los 9 departamentos.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Telopillo.bo - Marketplace Boliviano',
    description: 'Comprá y vendé de todo en Bolivia. Sin comisiones. 100% boliviano.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Saltar al contenido principal
            </a>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
