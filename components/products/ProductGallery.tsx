'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveProductImageUrls, shouldBypassNextImageOptimization } from '@/lib/utils/image'

interface ProductGalleryProps {
  images: string[]
  productTitle: string
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const frameRef = useRef<HTMLDivElement>(null)
  // Hover zoom only makes sense with a precise pointer; touch devices swipe instead.
  const [canHoverZoom, setCanHoverZoom] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHoverZoom(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const resolvedImages = resolveProductImageUrls(images)
  const selectedImage = resolvedImages[selectedIndex] ?? null

  // Anchor the zoom to the cursor position so the point under the pointer stays put.
  const handleZoomMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setZoomOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  if (resolvedImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Sin imágenes</p>
      </div>
    )
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index)
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main Image — 4:3 keeps title/price above the fold on desktop (F-4) */}
      <div
        ref={frameRef}
        className={`group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted ${
          canHoverZoom ? 'cursor-zoom-in' : ''
        }`}
        onMouseEnter={canHoverZoom ? () => setIsZooming(true) : undefined}
        onMouseMove={canHoverZoom ? handleZoomMove : undefined}
        onMouseLeave={canHoverZoom ? () => setIsZooming(false) : undefined}
      >
        <Image
          src={selectedImage ?? ''}
          alt={`${productTitle} - Imagen ${selectedIndex + 1}`}
          fill
          className="object-cover transition-transform duration-200 ease-out"
          style={{
            transform: isZooming ? 'scale(2)' : 'scale(1)',
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          priority={selectedIndex === 0}
          unoptimized={shouldBypassNextImageOptimization(selectedImage)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 66vw"
        />

        {/* Navigation Arrows (only if multiple images) — ≥44px touch targets (F-3) */}
        {resolvedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className={`absolute left-2 top-1/2 size-11 -translate-y-1/2 rounded-full shadow-lg transition-opacity ${
                isZooming ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              onClick={handlePrevious}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`absolute right-2 top-1/2 size-11 -translate-y-1/2 rounded-full shadow-lg transition-opacity ${
                isZooming ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              onClick={handleNext}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>

            {/* Image Counter */}
            <div
              className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedIndex + 1} / {resolvedImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (only if multiple images) */}
      {resolvedImages.length > 1 && (
        <div className="flex w-full flex-wrap gap-2">
          {resolvedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:size-20 ${
                index === selectedIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/20'
              }`}
              aria-label={`Ver imagen ${index + 1}`}
              aria-pressed={index === selectedIndex}
            >
              <Image
                src={image}
                alt={`${productTitle} - Miniatura ${index + 1}`}
                fill
                className="object-cover"
                unoptimized={shouldBypassNextImageOptimization(image)}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
