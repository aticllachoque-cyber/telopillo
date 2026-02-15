'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getAvatarColor } from '@/lib/utils'
import { Upload, X, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  userInitials: string
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userInitials,
  onUploadComplete,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

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
          <AvatarImage src={previewUrl || undefined} alt="Avatar preview" />
          <AvatarFallback className={`text-2xl font-medium ${getAvatarColor(userId)}`}>
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" aria-hidden /> : userInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
            aria-label="Seleccionar imagen de avatar"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Subiendo...
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

      <p className="text-xs text-muted-foreground">
        JPG, PNG o WebP. Máximo 5MB. La imagen se redimensionará automáticamente.
      </p>
    </div>
  )
}
