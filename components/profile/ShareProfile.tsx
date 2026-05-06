'use client'

import { useId, useState } from 'react'
import { Copy, Check, Share2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useSnackbar } from '@/components/ui/snackbar'

interface ShareProfileProps {
  profileId: string
  businessSlug?: string | null
  variant?: 'card' | 'compact'
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo'

/** DOMException from navigator.share may not be instanceof Error in some browsers. */
function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true
  if (err !== null && typeof err === 'object' && 'name' in err) {
    return String((err as { name: unknown }).name) === 'AbortError'
  }
  return false
}

export function ShareProfile({ profileId, businessSlug, variant = 'card' }: ShareProfileProps) {
  const { showSnackbar } = useSnackbar()
  const [copied, setCopied] = useState(false)
  const publicUrlId = useId()

  const shareUrl = businessSlug
    ? `${BASE_URL}/negocio/${businessSlug}`
    : `${BASE_URL}/vendedor/${profileId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showSnackbar('Enlace copiado', { variant: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showSnackbar('No se pudo copiar el enlace', { variant: 'error' })
    }
  }

  /**
   * Native share sheet (WhatsApp, etc.). Never falls back to clipboard — that is
   * what "Copiar enlace" is for; a silent copy made both buttons feel identical.
   */
  const handleShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      showSnackbar(
        'Tu navegador no ofrece compartir aquí. Usa «Copiar enlace» y pégalo en WhatsApp u otra app.',
        { variant: 'info', duration: 5000 }
      )
      return
    }

    const payload: ShareData = {
      title: 'Mi perfil en Telopillo',
      text: 'Mira mis productos en Telopillo',
      url: shareUrl,
    }

    try {
      await navigator.share(payload)
    } catch (err: unknown) {
      if (isAbortError(err)) return
      showSnackbar('No se pudo abrir compartir. Prueba «Copiar enlace».', { variant: 'error' })
    }
  }

  if (variant === 'compact') {
    return (
      <Button type="button" variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" aria-hidden />
        Compartir perfil
      </Button>
    )
  }

  return (
    <Card className="min-w-0 max-w-full border border-border/60 shadow-md">
      <CardHeader className="min-w-0 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <LinkIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="min-w-0 text-pretty text-lg font-semibold leading-snug">
            Compartir mi perfil
          </h2>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <p
          id={publicUrlId}
          className="min-w-0 max-w-full overflow-x-clip break-all rounded-md bg-muted px-3 py-2 font-mono text-sm leading-snug text-foreground [overflow-wrap:anywhere]"
          title={shareUrl}
        >
          <span className="sr-only">Enlace público: </span>
          {shareUrl}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Button
            type="button"
            variant="default"
            onClick={handleShare}
            className="min-h-[44px] min-w-0 gap-2 touch-manipulation sm:min-h-10 sm:flex-1"
          >
            <Share2 className="h-4 w-4 shrink-0" aria-hidden />
            Compartir
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="min-h-[44px] min-w-0 gap-2 touch-manipulation sm:min-h-10 sm:flex-1"
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
            ) : (
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span aria-live="polite">{copied ? 'Copiado' : 'Copiar enlace'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
