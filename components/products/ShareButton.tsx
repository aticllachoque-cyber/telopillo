'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  className?: string
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const handleShare = () => {
    const url = window.location.href
    const text = `Mira este producto: ${title} - ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn('flex min-h-[44px] items-center gap-2', className)}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      Compartir
    </Button>
  )
}
