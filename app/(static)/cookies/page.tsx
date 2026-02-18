import type { Metadata } from 'next'
import { Construction } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Política de cookies de Telopillo.bo.',
}

export default function CookiesPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <Construction className="size-12 text-primary" aria-hidden />
      <h1 className="mt-4 text-balance text-2xl font-bold sm:text-3xl">Cookies</h1>
      <p className="mt-2 max-w-md text-pretty text-muted-foreground">
        Estamos preparando esta página. Pronto vas a poder leer nuestra política de cookies.
      </p>
    </div>
  )
}
