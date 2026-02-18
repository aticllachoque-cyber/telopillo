'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  businessProfileSchema,
  type BusinessProfileInput,
  BUSINESS_CATEGORIES,
} from '@/lib/validations/business-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LocationSelector } from '@/components/profile/LocationSelector'
import { BusinessHoursEditor } from '@/components/profile/BusinessHoursEditor'
import { useToast } from '@/components/ui/toast'
import { getAvatarColor } from '@/lib/utils'

interface BusinessProfileFormProps {
  userId: string
  onSaved?: () => void
}

export function BusinessProfileForm({ userId, onSaved }: BusinessProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [businessHours, setBusinessHours] = useState<Record<string, string>>({})
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
  })

  const department = watch('business_department')
  const city = watch('business_city')

  useEffect(() => {
    loadBusinessProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadBusinessProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found

      if (data) {
        setHasExistingProfile(true)
        setValue('business_name', data.business_name || '')
        setValue('business_description', data.business_description || '')
        setValue('business_category', data.business_category || '')
        setValue('nit', data.nit || '')
        setValue('website_url', data.website_url || '')
        setValue('social_facebook', data.social_facebook || '')
        setValue('social_instagram', data.social_instagram || '')
        setValue('social_tiktok', data.social_tiktok || '')
        setValue('social_whatsapp', data.social_whatsapp || '')
        setValue('business_address', data.business_address || '')
        setValue('business_department', data.business_department || '')
        setValue('business_city', data.business_city || '')
        setLogoUrl(data.business_logo_url || null)
        if (data.business_hours && typeof data.business_hours === 'object') {
          setBusinessHours(data.business_hours as Record<string, string>)
        }
      }
    } catch (err) {
      console.error('Error loading business profile:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona una imagen')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setIsUploadingLogo(true)
      setUploadError(null)

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('business-logos').getPublicUrl(fileName)

      // Update business profile with logo URL
      await supabase
        .from('business_profiles')
        .update({ business_logo_url: publicUrl })
        .eq('id', userId)

      setLogoUrl(publicUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      setIsUploadingLogo(true)
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      await Promise.all(
        extensions.map((ext) =>
          supabase.storage.from('business-logos').remove([`${userId}/logo.${ext}`])
        )
      )
      await supabase.from('business_profiles').update({ business_logo_url: null }).eq('id', userId)
      setLogoUrl(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al eliminar logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = async (data: BusinessProfileInput) => {
    try {
      setIsSaving(true)

      const payload = {
        business_name: data.business_name,
        business_description: data.business_description || null,
        business_category: data.business_category || null,
        nit: data.nit || null,
        website_url: data.website_url || null,
        social_facebook: data.social_facebook || null,
        social_instagram: data.social_instagram || null,
        social_tiktok: data.social_tiktok || null,
        social_whatsapp: data.social_whatsapp || null,
        business_hours: Object.keys(businessHours).length > 0 ? businessHours : null,
        business_address: data.business_address || null,
        business_department: data.business_department || null,
        business_city: data.business_city || null,
      }

      if (hasExistingProfile) {
        const { error } = await supabase.from('business_profiles').update(payload).eq('id', userId)
        if (error) throw error
      } else {
        // Generate slug server-side via RPC
        const { data: slugResult } = await supabase.rpc('generate_slug', {
          input: data.business_name,
        })
        const { error } = await supabase
          .from('business_profiles')
          .insert({ id: userId, slug: slugResult || 'negocio', ...payload })
        if (error) throw error
        setHasExistingProfile(true)
      }

      showToast('Perfil de negocio guardado exitosamente', 'success')
      onSaved?.()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar perfil de negocio', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="ml-2 text-sm text-muted-foreground">Cargando datos del negocio...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo */}
      <div className="space-y-3">
        <Label>Logo del Negocio</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={logoUrl || undefined} alt="Logo del negocio" />
            <AvatarFallback className={`text-lg font-medium ${getAvatarColor(userId)}`}>
              {isUploadingLogo ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : 'BZ'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
              disabled={isUploadingLogo || isSaving}
              aria-label="Seleccionar logo del negocio"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo || isSaving}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" aria-hidden />
                  {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                </>
              )}
            </Button>
            {logoUrl && !isUploadingLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" aria-hidden />
                Eliminar
              </Button>
            )}
          </div>
        </div>
        {uploadError && (
          <p className="text-sm text-destructive" role="alert">
            {uploadError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Máximo 5MB.</p>
      </div>

      <Separator />

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">Información del Negocio</h3>

        <div className="space-y-2">
          <Label htmlFor="business_name">Nombre del Negocio *</Label>
          <Input
            id="business_name"
            placeholder="Mi Tienda Bolivia"
            className="h-11"
            aria-invalid={!!errors.business_name}
            aria-describedby={errors.business_name ? 'business_name-error' : undefined}
            {...register('business_name')}
            disabled={isSaving}
          />
          {errors.business_name && (
            <p id="business_name-error" className="text-sm text-destructive" role="alert">
              {errors.business_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_description">Descripción</Label>
          <Textarea
            id="business_description"
            placeholder="Cuéntanos sobre tu negocio..."
            rows={3}
            aria-invalid={!!errors.business_description}
            aria-describedby={
              errors.business_description ? 'business_description-error' : undefined
            }
            {...register('business_description')}
            disabled={isSaving}
          />
          {errors.business_description && (
            <p id="business_description-error" className="text-sm text-destructive" role="alert">
              {errors.business_description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business_category">Categoría</Label>
            <Select
              value={watch('business_category') || ''}
              onValueChange={(val) => setValue('business_category', val)}
              disabled={isSaving}
            >
              <SelectTrigger
                className="h-11 w-full"
                id="business_category"
                aria-invalid={!!errors.business_category}
              >
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nit">NIT (opcional)</Label>
            <Input
              id="nit"
              placeholder="1234567890"
              className="h-11"
              aria-invalid={!!errors.nit}
              aria-describedby={errors.nit ? 'nit-error' : undefined}
              {...register('nit')}
              disabled={isSaving}
            />
            {errors.nit && (
              <p id="nit-error" className="text-sm text-destructive" role="alert">
                {errors.nit.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-4">
        <h3 className="font-semibold">Ubicación</h3>

        <LocationSelector
          department={department || null}
          city={city || null}
          onDepartmentChange={(val) => setValue('business_department', val)}
          onCityChange={(val) => setValue('business_city', val)}
          disabled={isSaving}
          errors={{
            department: errors.business_department?.message,
            city: errors.business_city?.message,
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="business_address">Dirección</Label>
          <Input
            id="business_address"
            placeholder="Av. Ejemplo #123, Zona Centro"
            className="h-11"
            {...register('business_address')}
            disabled={isSaving}
          />
        </div>
      </div>

      <Separator />

      {/* Business Hours */}
      <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} disabled={isSaving} />

      <Separator />

      {/* Social Links & Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold">Redes Sociales y Contacto</h3>

        <div className="space-y-2">
          <Label htmlFor="website_url">Sitio Web</Label>
          <Input
            id="website_url"
            type="url"
            placeholder="https://mitienda.com"
            className="h-11"
            aria-invalid={!!errors.website_url}
            aria-describedby={errors.website_url ? 'website_url-error' : undefined}
            {...register('website_url')}
            disabled={isSaving}
          />
          {errors.website_url && (
            <p id="website_url-error" className="text-sm text-destructive" role="alert">
              {errors.website_url.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="social_facebook">Facebook</Label>
            <Input
              id="social_facebook"
              placeholder="https://facebook.com/mitienda"
              className="h-11"
              aria-invalid={!!errors.social_facebook}
              aria-describedby={errors.social_facebook ? 'social_facebook-error' : undefined}
              {...register('social_facebook')}
              disabled={isSaving}
            />
            {errors.social_facebook && (
              <p id="social_facebook-error" className="text-sm text-destructive" role="alert">
                {errors.social_facebook.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_instagram">Instagram</Label>
            <Input
              id="social_instagram"
              placeholder="@mitienda"
              className="h-11"
              {...register('social_instagram')}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_tiktok">TikTok</Label>
            <Input
              id="social_tiktok"
              placeholder="@mitienda"
              className="h-11"
              {...register('social_tiktok')}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_whatsapp">WhatsApp</Label>
            <Input
              id="social_whatsapp"
              type="tel"
              placeholder="+591 7XXXXXXX"
              className="h-11"
              aria-invalid={!!errors.social_whatsapp}
              aria-describedby={errors.social_whatsapp ? 'social_whatsapp-error' : undefined}
              {...register('social_whatsapp')}
              disabled={isSaving}
            />
            {errors.social_whatsapp && (
              <p id="social_whatsapp-error" className="text-sm text-destructive" role="alert">
                {errors.social_whatsapp.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Save */}
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Guardando Negocio...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            Guardar Perfil de Negocio
          </>
        )}
      </Button>
    </form>
  )
}
