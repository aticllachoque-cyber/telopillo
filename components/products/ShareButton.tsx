'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
}

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = () => {
    const url = window.location.href
    const text = `Mira este producto: ${title} - ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
      <Share2 className="h-4 w-4" aria-hidden />
      Compartir
    </Button>
  )
}
