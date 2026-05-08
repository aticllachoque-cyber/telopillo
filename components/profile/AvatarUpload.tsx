'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getAvatarColor } from '@/lib/utils'
import { isHeicLikeImage, uploadStorageImage, validateImageFile } from '@/lib/utils/image'
import { Upload, X, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  userInitials: string
  onUploadComplete: (url: string) => void
  /** Sets `id` on the hidden file input so an external `<Label htmlFor>` can reference it */
  fileInputId?: string
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userInitials,
  onUploadComplete,
  fileInputId,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [busyMessage, setBusyMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Por favor selecciona una imagen válida')
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setBusyMessage(
        isHeicLikeImage(file) ? 'Procesando foto del iPhone...' : 'Procesando imagen...'
      )

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      const { publicUrl } = await uploadStorageImage({
        storage: supabase.storage,
        bucket: 'avatars',
        path: `${userId}/avatar.webp`,
        file,
        upsert: true,
      })

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onUploadComplete(publicUrl)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al subir imagen')
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setIsUploading(false)
      setBusyMessage(null)
    }
  }

  const handleRemove = async () => {
    try {
      setIsUploading(true)
      setError(null)

      // Remove from storage (try all common extensions)
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      await Promise.all(
        extensions.map((ext) =>
          supabase.storage.from('avatars').remove([`${userId}/avatar.${ext}`])
        )
      )

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      setPreviewUrl(null)
      onUploadComplete('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar imagen')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || undefined} alt="Vista previa de tu foto de perfil" />
          <AvatarFallback className={`text-2xl font-medium ${getAvatarColor(userId)}`}>
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" aria-hidden /> : userInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
            aria-label="Seleccionar imagen de avatar"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0 touch-manipulation"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {busyMessage || 'Subiendo...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" aria-hidden />
                Cambiar Foto
              </>
            )}
          </Button>

          {previewUrl && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[44px] sm:min-h-0 touch-manipulation"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" aria-hidden />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <p className="text-pretty text-xs text-muted-foreground">
        JPG, PNG, WebP o HEIC/HEIF · máx. 5MB, o 25MB si es HEIC · se optimiza al subir.
      </p>
    </div>
  )
}
