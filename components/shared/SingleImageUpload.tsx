'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createImagePreview,
  getStoragePathFromPublicUrl,
  removeStorageImageByPublicUrl,
  revokeImagePreview,
  uploadStorageImage,
  validateImageFile,
} from '@/lib/utils/image'
import { Button } from '@/components/ui/button'
import { CameraIcon, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'

interface SingleImageUploadProps {
  userId: string
  bucket: string
  value: string | null
  onChange: (url: string | null) => void
  buildPath: (userId: string) => string
  disabled?: boolean
  error?: string
  label: string
  helpText?: string
  emptyStateLabel?: string
}

export function SingleImageUpload({
  userId,
  bucket,
  value,
  onChange,
  buildPath,
  disabled = false,
  error,
  label,
  helpText,
  emptyStateLabel = 'Subir imagen',
}: SingleImageUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const temporaryPreviewRef = useRef<string | null>(null)
  const initialPersistedValueRef = useRef<string | null>(value)
  const stagedUploadUrlsRef = useRef<Set<string>>(new Set())
  const [previewUrl, setPreviewUrl] = useState<string | null>(value)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setPreviewUrl(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (temporaryPreviewRef.current) {
        revokeImagePreview(temporaryPreviewRef.current)
      }
    }
  }, [])

  const resetInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const clearTemporaryPreview = () => {
    if (temporaryPreviewRef.current) {
      revokeImagePreview(temporaryPreviewRef.current)
      temporaryPreviewRef.current = null
    }
  }

  const isPersistedValue = (publicUrl: string | null) =>
    publicUrl === initialPersistedValueRef.current

  const isStagedUpload = (publicUrl: string | null) =>
    !!publicUrl && stagedUploadUrlsRef.current.has(publicUrl)

  const removeCurrentStoredImage = async (publicUrl: string | null) => {
    if (!publicUrl || !publicUrl.includes('supabase')) return
    if (!getStoragePathFromPublicUrl(bucket, publicUrl)) return

    try {
      await removeStorageImageByPublicUrl(supabase.storage, bucket, publicUrl)
      stagedUploadUrlsRef.current.delete(publicUrl)
    } catch (removeError) {
      console.error('[SingleImageUpload] Failed to remove previous image:', removeError)
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled || isUploading) return

    const file = files[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Archivo inválido')
      resetInputs()
      return
    }

    setIsUploading(true)
    setUploadError(null)

    const previousValue = value
    const tempPreview = createImagePreview(file)
    clearTemporaryPreview()
    temporaryPreviewRef.current = tempPreview
    setPreviewUrl(tempPreview)

    try {
      const { publicUrl } = await uploadStorageImage({
        storage: supabase.storage,
        bucket,
        path: buildPath(userId),
        file,
      })

      if (isStagedUpload(previousValue) && !isPersistedValue(previousValue)) {
        await removeCurrentStoredImage(previousValue)
      }

      stagedUploadUrlsRef.current.add(publicUrl)
      clearTemporaryPreview()
      setPreviewUrl(publicUrl)
      onChange(publicUrl)
    } catch (uploadErr) {
      console.error('[SingleImageUpload] Upload failed:', uploadErr)
      clearTemporaryPreview()
      setPreviewUrl(previousValue)
      setUploadError(uploadErr instanceof Error ? uploadErr.message : 'No se pudo subir la imagen')
    } finally {
      setIsUploading(false)
      resetInputs()
    }
  }

  const handleRemove = async () => {
    if (disabled || isUploading) return

    const previousValue = value
    clearTemporaryPreview()
    setUploadError(null)

    if (isStagedUpload(previousValue) && !isPersistedValue(previousValue)) {
      await removeCurrentStoredImage(previousValue)
    }

    setPreviewUrl(null)
    onChange(null)
    resetInputs()
  }

  const currentError = error || uploadError

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || isUploading}
          aria-label={label}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || isUploading}
          aria-label={`${label} desde cámara`}
        />

        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="relative aspect-[16/10] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" aria-hidden />
                    <p className="text-xs text-muted-foreground">Subiendo...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border/60 p-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] flex-1 touch-manipulation"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden />
                Reemplazar imagen
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="min-h-[44px] touch-manipulation"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Quitar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2
                  className="mb-3 h-10 w-10 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : (
                <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
              )}
              <p className="text-sm font-medium">{emptyStateLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WebP. Máximo 5MB.</p>
            </button>

            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full touch-manipulation sm:hidden"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <CameraIcon className="mr-2 h-4 w-4" aria-hidden />
              Tomar foto
            </Button>
          </div>
        )}
      </div>

      {currentError && (
        <p className="text-sm text-destructive" role="alert">
          {currentError}
        </p>
      )}
    </div>
  )
}
