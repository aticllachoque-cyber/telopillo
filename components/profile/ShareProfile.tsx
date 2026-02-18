'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

interface ShareProfileProps {
  profileId: string
  businessSlug?: string | null
  variant?: 'card' | 'compact'
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo.bo'

export function ShareProfile({ profileId, businessSlug, variant = 'card' }: ShareProfileProps) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  const shareUrl = businessSlug
    ? `${BASE_URL}/negocio/${businessSlug}`
    : `${BASE_URL}/vendedor/${profileId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showToast('Enlace copiado', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('No se pudo copiar el enlace', 'error')
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Mi perfil en Telopillo.bo',
          text: 'Mira mis productos en Telopillo.bo',
          url: shareUrl,
        })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    await handleCopy()
  }

  if (variant === 'compact') {
    return (
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" aria-hidden />
        Compartir perfil
      </Button>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">Compartir mi perfil</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="truncate rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground"
          title={shareUrl}
          role="textbox"
          aria-readonly="true"
          aria-label="Tu enlace público de perfil"
          tabIndex={0}
        >
          {shareUrl}
        </div>
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={handleShare}
            className="gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Compartir
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            <span aria-live="polite">{copied ? 'Copiado' : 'Copiar enlace'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
