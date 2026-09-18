'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { Button } from '@/components/ui/button'
import { resolveProductImageUrls, shouldBypassNextImageOptimization } from '@/lib/utils/image'

interface ProductGalleryProps {
  images: string[]
  productTitle: string
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
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

  // Finite navigation: arrows stop at the first/last image instead of wrapping around.
  const isFirstImage = selectedIndex === 0
  const isLastImage = selectedIndex === resolvedImages.length - 1

  const handlePrevious = () => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => Math.min(prev + 1, resolvedImages.length - 1))
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index)
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main Image — 4:3 keeps title/price above the fold on desktop (F-4) */}
      <div
        className={`group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted ${
          canHoverZoom ? 'cursor-zoom-in' : ''
        }`}
        onMouseEnter={
          canHoverZoom
            ? (event) => {
                // Reset to center so re-hovering does not jump to the previous origin.
                handleZoomMove(event)
                setIsZooming(true)
              }
            : undefined
        }
        onMouseMove={canHoverZoom ? handleZoomMove : undefined}
        onMouseLeave={canHoverZoom ? () => setIsZooming(false) : undefined}
      >
        <Image
          src={selectedImage ?? ''}
          alt={`${productTitle} - Imagen ${selectedIndex + 1}`}
          fill
          className="object-cover transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            transform: isZooming ? 'scale(2)' : 'scale(1)',
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          priority={selectedIndex === 0}
          unoptimized={shouldBypassNextImageOptimization(selectedImage)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 66vw"
        />

        {/* Tap/click target for the fullscreen lightbox (pinch-zoom on mobile) */}
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Ampliar imagen"
        />

        {/* Navigation Arrows (only if multiple images) — ≥44px touch targets (F-3) */}
        {resolvedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full shadow-lg"
              onClick={handlePrevious}
              disabled={isFirstImage}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full shadow-lg"
              onClick={handleNext}
              disabled={isLastImage}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>

            {/* Image Counter */}
            <div
              className="absolute bottom-4 right-4 z-20 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium"
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

      {/* Fullscreen viewer — pinch-zoom on touch, wheel/double-click on desktop */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={selectedIndex}
        slides={resolvedImages.map((image) => ({ src: image }))}
        plugins={[Zoom, Thumbnails, Counter]}
        // Disable Prev/Next at the ends (and block swiping past them) instead of looping.
        carousel={{ finite: true }}
        // "1 / 5" position indicator (top-left corner by default; thumbnails occupy the bottom)
        counter={{ separator: '/' }}
        thumbnails={{ position: 'bottom' }}
        zoom={{ doubleClickDelay: 300 }}
        labels={{
          Close: 'Cerrar',
          Previous: 'Imagen anterior',
          Next: 'Imagen siguiente',
          'Zoom in': 'Acercar',
          'Zoom out': 'Alejar',
        }}
        on={{ view: ({ index: viewIndex }) => setSelectedIndex(viewIndex) }}
      />
    </div>
  )
}
