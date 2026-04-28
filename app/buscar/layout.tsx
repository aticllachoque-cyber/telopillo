import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar productos',
  description:
    'Buscá productos nuevos y usados en Bolivia: categoría, departamento, precio y texto libre en Telopillo.',
  openGraph: {
    title: 'Buscar productos | Telopillo',
    description:
      'Encontrá lo que buscás con filtros por ubicación, categoría y precio en el marketplace boliviano.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return children
}
