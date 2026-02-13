'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileInput } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocationSelector } from '@/components/profile/LocationSelector'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

export default function ProfileEditPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('U')
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Editar Perfil - Telopillo.bo'
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
        router.push('/login')
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

        // Set initials
        const initials = profile.full_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || 'U')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar perfil')
    } finally {
      setIsLoading(false)
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

      setSuccess(true)
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg bg-green-50 p-8 dark:bg-green-950">
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
            <h2 className="mb-2 text-2xl font-bold">¡Perfil Actualizado!</h2>
            <p className="text-muted-foreground">Tu información ha sido guardada exitosamente.</p>
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al perfil
        </Link>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Editar Perfil</CardTitle>
          <CardDescription>
            Completa tu información para empezar a publicar y comprar
          </CardDescription>
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
                <Label>Foto de Perfil</Label>
                <AvatarUpload
                  userId={userId}
                  currentAvatarUrl={avatarUrl}
                  userInitials={userInitials}
                  onUploadComplete={(url) => setAvatarUrl(url)}
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
                {...register('phone')}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Tu número de contacto para compradores
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

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/profile')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
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
    </div>
  )
}
