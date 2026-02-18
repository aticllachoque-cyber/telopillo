'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  compressImage,
  validateImageFile,
  getProductImagePath,
  createImagePreview,
  revokeImagePreview,
} from '@/lib/utils/image'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Upload, X, Loader2, CameraIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageUploadProps {
  userId: string
  value: string[] // Array of image URLs
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  error?: string
}

interface ImagePreview {
  url: string // Object URL for preview or uploaded URL
  file?: File // Original file (if not yet uploaded)
  uploading: boolean
  uploaded: boolean
  error?: string
}

export function ImageUpload({
  userId,
  value = [],
  onChange,
  maxImages = 5,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>(
    value.map((url) => ({ url, uploading: false, uploaded: true }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  // Sync uploaded URLs with parent component
  useEffect(() => {
    const uploadedUrls = previews.filter((p) => p.uploaded).map((p) => p.url)
    onChange(uploadedUrls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews])

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - previews.length

    if (fileArray.length > remainingSlots) {
      showToast(`Solo puedes subir ${remainingSlots} imagen(es) más`, 'warning')
      return
    }

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        showToast(validation.error || 'Archivo inválido', 'error')
        return
      }
    }

    // Create previews and start uploading
    const newPreviews: ImagePreview[] = fileArray.map((file) => ({
      url: createImagePreview(file),
      file,
      uploading: true,
      uploaded: false,
    }))

    setPreviews((prev) => [...prev, ...newPreviews])
    setUploadingCount(fileArray.length)

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]!
      const previewIndex = previews.length + i

      try {
        // Compress image
        const compressedBlob = await compressImage(file)

        // Generate storage path
        const storagePath = getProductImagePath(userId, Date.now() + i)

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(storagePath, compressedBlob, {
            contentType: 'image/webp',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(data.path)

        // Update preview with uploaded URL
        setPreviews((prev) => {
          const updated = [...prev]
          // Revoke object URL
          const existing = updated[previewIndex]
          if (existing) revokeImagePreview(existing.url)
          updated[previewIndex] = {
            url: publicUrl,
            uploading: false,
            uploaded: true,
          }
          return updated
        })
        setUploadingCount((c) => Math.max(0, c - 1))
      } catch (err) {
        console.error('Error uploading image:', err)
        setPreviews((prev) => {
          const updated = [...prev]
          const existing = updated[previewIndex]
          if (existing) {
            updated[previewIndex] = {
              ...existing,
              uploading: false,
              uploaded: false,
              error: err instanceof Error ? err.message : 'Error al subir imagen',
            }
          }
          return updated
        })
        setUploadingCount((c) => Math.max(0, c - 1))
      }
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  // Handle remove image
  const handleRemove = async (index: number) => {
    const preview = previews[index]
    if (!preview) return

    // If uploaded to storage, delete it
    if (preview.uploaded && preview.url.includes('supabase')) {
      try {
        // Extract path from URL
        const urlParts = preview.url.split('/product-images/')
        if (urlParts.length > 1) {
          const path = urlParts[1]?.split('?')[0] // Remove query params
          if (path) await supabase.storage.from('product-images').remove([path])
        }
      } catch (err) {
        console.error('Error deleting image from storage:', err)
      }
    } else {
      // Revoke object URL if not uploaded
      revokeImagePreview(preview.url)
    }

    // Remove from previews
    const updated = previews.filter((_, i) => i !== index)
    setPreviews(updated)
  }

  // Handle reorder with buttons (keyboard accessible)
  const handleMoveLeft = (index: number) => {
    if (index === 0) return
    const updated = [...previews]
    const current = updated[index]
    const previous = updated[index - 1]
    if (current && previous) {
      updated[index] = previous
      updated[index - 1] = current
      setPreviews(updated)
    }
  }

  const handleMoveRight = (index: number) => {
    if (index === previews.length - 1) return
    const updated = [...previews]
    const current = updated[index]
    const next = updated[index + 1]
    if (current && next) {
      updated[index] = next
      updated[index + 1] = current
      setPreviews(updated)
    }
  }

  // Handle reorder (drag to reorder)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    // Reorder previews
    const updated = [...previews]
    const draggedItem = updated[draggedIndex]
    if (!draggedItem) return
    updated.splice(draggedIndex, 1)
    updated.splice(index, 0, draggedItem)

    setPreviews(updated)
    setDraggedIndex(index)
  }

  return (
    <div className="space-y-4" role="group" aria-labelledby="image-upload-label">
      <span id="image-upload-label" className="sr-only">
        Carga de imágenes del producto
      </span>

      {/* Upload Status (screen reader live region) */}
      <div role="status" aria-live="polite" className="sr-only">
        {uploadingCount > 0
          ? `Subiendo ${uploadingCount} imagen${uploadingCount > 1 ? 'es' : ''}...`
          : ''}
      </div>

      {/* Upload Zone */}
      {previews.length < maxImages && (
        <div className="space-y-3">
          {/* Main upload zone: gallery/file picker */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center
              transition-colors cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Seleccionar imágenes de la galería"
            aria-describedby={error ? 'image-upload-error' : 'image-upload-help'}
            aria-disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!disabled) {
                  fileInputRef.current?.click()
                }
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
              aria-label="Seleccionar imágenes de la galería"
            />

            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden />

            <p className="text-sm font-medium mb-2">
              {isDragging ? (
                'Suelta las imágenes aquí'
              ) : (
                <>
                  <span className="sm:hidden">Toca para seleccionar imágenes</span>
                  <span className="hidden sm:inline">
                    Arrastra imágenes o haz click para seleccionar
                  </span>
                </>
              )}
            </p>

            <p id="image-upload-help" className="text-xs text-muted-foreground">
              JPG, PNG o WebP • Máximo 5MB por imagen • {previews.length}/{maxImages} imágenes
            </p>
          </div>

          {/* Camera capture button (visible on mobile) */}
          <button
            type="button"
            onClick={() => !disabled && cameraInputRef.current?.click()}
            disabled={disabled}
            className={`
              sm:hidden w-full flex items-center justify-center gap-2 border-2 border-dashed
              rounded-lg p-4 text-sm font-medium transition-colors min-h-[44px] touch-manipulation
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'border-muted-foreground/25 hover:border-primary/50 text-muted-foreground hover:text-foreground cursor-pointer'}
            `}
            aria-label="Tomar foto con la cámara"
          >
            <CameraIcon className="h-5 w-5" aria-hidden />
            Tomar foto
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
            aria-label="Tomar foto con la cámara"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p
          id="image-upload-error"
          className="text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              draggable={!preview.uploading && !disabled}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={`
                relative group rounded-lg overflow-hidden border-2
                ${draggedIndex === index ? 'border-primary opacity-50' : 'border-border'}
                ${!preview.uploading && !disabled ? 'sm:cursor-move' : ''}
              `}
            >
              {/* Drag Handle (desktop only) */}
              {!preview.uploading && !disabled && (
                <div className="hidden sm:flex absolute top-2 left-2 z-10 bg-background/80 rounded p-1">
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>
              )}

              {/* Image Index Badge */}
              <div className="absolute top-2 right-2 z-10 bg-background/80 rounded px-2 py-1 text-xs font-medium">
                {index === 0 ? 'Portada' : index + 1}
              </div>

              {/* Image */}
              <div className="aspect-square relative bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={`Imagen ${index + 1} del producto${index === 0 ? ' (portada)' : ''}`}
                  className="w-full h-full object-cover"
                />

                {/* Loading Overlay */}
                {preview.uploading && (
                  <div
                    className="absolute inset-0 bg-background/80 flex items-center justify-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" aria-hidden />
                      <p className="text-xs text-muted-foreground">Subiendo...</p>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {preview.error && (
                  <div
                    className="absolute inset-0 bg-destructive/10 flex items-center justify-center p-2"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="text-xs text-destructive text-center">{preview.error}</p>
                  </div>
                )}
              </div>

              {/* Reorder Buttons (always visible on mobile, hover on desktop) */}
              {!preview.uploading && previews.length > 1 && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] h-11 w-11 md:h-8 md:w-8 md:min-h-0 md:min-w-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus:opacity-100 transition-opacity shadow-lg touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveLeft(index)
                    }}
                    disabled={disabled || index === 0}
                    aria-label={`Mover imagen ${index + 1} a la izquierda`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] h-11 w-11 md:h-8 md:w-8 md:min-h-0 md:min-w-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus:opacity-100 transition-opacity shadow-lg touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveRight(index)
                    }}
                    disabled={disabled || index === previews.length - 1}
                    aria-label={`Mover imagen ${index + 1} a la derecha`}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              )}

              {/* Remove Button */}
              {!preview.uploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-2 right-2 min-h-[44px] min-w-[44px] h-11 w-11 md:h-8 md:w-8 md:min-h-0 md:min-w-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus:opacity-100 transition-opacity shadow-lg touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  disabled={disabled}
                  aria-label={`Eliminar imagen ${index + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text (device-aware) */}
      {previews.length > 0 && previews.length < maxImages && (
        <p className="text-xs text-muted-foreground" aria-hidden="true">
          <span className="sm:hidden">
            Usá las flechas para reordenar. La primera será la imagen principal.
          </span>
          <span className="hidden sm:inline">
            Arrastra las imágenes para reordenarlas. La primera será la imagen principal.
          </span>
        </p>
      )}
    </div>
  )
}
