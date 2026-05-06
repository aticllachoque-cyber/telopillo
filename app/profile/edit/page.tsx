'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, Store, Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileInput } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocationSelector } from '@/components/profile/LocationSelector'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { BusinessProfileForm } from '@/components/profile/BusinessProfileForm'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { useSnackbar } from '@/components/ui/snackbar'

export default function ProfileEditPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('U')
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false)
  const [verificationLevel, setVerificationLevel] = useState(0)
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false)
  const supabase = createClient()
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    document.title = 'Editar Perfil - Telopillo'
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  const department = watch('location_department')
  const city = watch('location_city')

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/profile/edit')
        return
      }

      setUserId(user.id)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (profile) {
        setValue('full_name', profile.full_name || '')
        setValue('phone', profile.phone || '')
        setValue('location_department', profile.location_department || '')
        setValue('location_city', profile.location_city || '')
        setAvatarUrl(profile.avatar_url)
        setVerificationLevel(profile.verification_level ?? 0)

        const initials = profile.full_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || 'U')
      }

      // Check if user has a business profile
      const { data: bizProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      setHasBusinessProfile(!!bizProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBusinessProfile = async () => {
    if (!userId) return

    try {
      setIsCreatingBusiness(true)

      const fullName = watch('full_name') || 'Mi Negocio'
      const { data: slugResult } = await supabase.rpc('generate_slug', { input: fullName })

      const { error: insertError } = await supabase.from('business_profiles').insert({
        id: userId,
        business_name: fullName,
        slug: slugResult || 'negocio',
      })

      if (insertError) throw insertError

      setHasBusinessProfile(true)
      showSnackbar('Perfil de negocio creado. Completa tu información abajo.', {
        variant: 'success',
      })
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al crear perfil de negocio', {
        variant: 'error',
      })
    } finally {
      setIsCreatingBusiness(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    try {
      setIsSaving(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          location_department: data.location_department,
          location_city: data.location_city,
        })
        .eq('id', user.id)

      if (error) throw error

      // Re-fetch to get updated verification_level (auto-trigger on phone change)
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('verification_level')
        .eq('id', user.id)
        .single()

      if (updatedProfile) {
        setVerificationLevel(updatedProfile.verification_level ?? 0)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !userId) {
    return (
      <div className="container mx-auto flex min-h-dvh items-center justify-center">
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md text-center" role="status" aria-live="polite">
          <div className="rounded-lg border border-green-200/80 bg-green-50 p-8 dark:border-green-800 dark:bg-green-950">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-balance">¡Perfil actualizado!</h2>
            <p className="text-pretty text-muted-foreground">
              Tu información se guardó correctamente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground min-h-[44px] py-2 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al perfil
        </Link>
      </div>

      <div className="space-y-6">
        {/* Personal Profile Card */}
        <Card className="border border-border/60 shadow-md">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-semibold leading-tight text-balance sm:text-3xl">
                  Editar Perfil
                </h1>
                <CardDescription className="text-pretty">
                  Completa tus datos básicos para publicar y comprar con confianza.
                </CardDescription>
              </div>
              <VerificationBadge
                hasBusinessProfile={hasBusinessProfile}
                verificationLevel={verificationLevel}
                showTeaser={false}
                className="shrink-0 self-start"
              />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Avatar Upload Section */}
              {userId && (
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar-file">Foto de perfil</Label>
                  <AvatarUpload
                    userId={userId}
                    currentAvatarUrl={avatarUrl}
                    userInitials={userInitials}
                    onUploadComplete={(url) => setAvatarUrl(url)}
                    fileInputId="profile-avatar-file"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Juan Pérez"
                  className="h-11"
                  autoComplete="name"
                  aria-invalid={!!errors.full_name}
                  aria-describedby={errors.full_name ? 'full_name-error' : undefined}
                  {...register('full_name')}
                  disabled={isSaving}
                />
                {errors.full_name && (
                  <p id="full_name-error" className="text-sm text-destructive" role="alert">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="7XXXXXXX"
                  className="h-11"
                  autoComplete="tel"
                  aria-describedby="phone-hint"
                  {...register('phone')}
                  disabled={isSaving}
                />
                <p id="phone-hint" className="text-pretty text-xs text-muted-foreground">
                  Visible para compradores; ayuda a subir tu nivel de confianza.
                </p>
              </div>

              <LocationSelector
                department={department}
                city={city}
                onDepartmentChange={(value) => setValue('location_department', value)}
                onCityChange={(value) => setValue('location_city', value)}
                disabled={isSaving}
                errors={{
                  department: errors.location_department?.message,
                  city: errors.location_city?.message,
                }}
              />

              <div className="flex gap-3 pt-4 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] flex-1 touch-manipulation sm:min-h-11"
                  onClick={() => router.push('/profile')}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="min-h-[44px] flex-1 touch-manipulation sm:min-h-11"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Business Profile Section - available to ALL users */}
        {userId && hasBusinessProfile ? (
          <Card className="border border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Store className="h-5 w-5 shrink-0" aria-hidden />
                <span className="text-balance">Perfil de negocio</span>
              </CardTitle>
              <CardDescription className="text-pretty">
                Datos de tu tienda visibles para compradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessProfileForm userId={userId} />
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/60 shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
                <Store className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <CardTitle className="text-balance text-xl">¿Tienes un negocio?</CardTitle>
              <CardDescription className="mx-auto max-w-md text-pretty">
                Activa tu tienda virtual con logo, horarios y redes. Puedes hacerlo en cualquier
                momento.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleCreateBusinessProfile}
                disabled={isCreatingBusiness}
                className="min-h-[44px] gap-2 touch-manipulation sm:min-h-10"
              >
                {isCreatingBusiness ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden />
                    Crear Perfil de Negocio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
