import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Publicar producto',
  description:
    'Publicá tu producto gratis en Telopillo: fotos, precio, categoría y ubicación en Bolivia.',
  openGraph: {
    title: 'Publicar producto | Telopillo',
    description:
      'Creá tu publicación en el marketplace boliviano: sin comisiones y con búsqueda inteligente.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function PublicarLayout({ children }: { children: React.ReactNode }) {
  return children
}
