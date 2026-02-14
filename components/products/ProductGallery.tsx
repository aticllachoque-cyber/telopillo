'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductGalleryProps {
  images: string[]
  productTitle: string
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Sin imágenes</p>
      </div>
    )
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index)
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        <Image
          src={images[selectedIndex] ?? ''}
          alt={`${productTitle} - Imagen ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority={selectedIndex === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Navigation Arrows (only if multiple images) */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 md:opacity-70 md:hover:opacity-100 md:focus:opacity-100 transition-opacity shadow-lg"
              onClick={handlePrevious}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 md:opacity-70 md:hover:opacity-100 md:focus:opacity-100 transition-opacity shadow-lg"
              onClick={handleNext}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>

            {/* Image Counter */}
            <div
              className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (only if multiple images) */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
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
                sizes="(max-width: 768px) 20vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
