'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  Edit,
  LogOut,
  Package,
  Plus,
  Store,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ShareProfile } from '@/components/profile/ShareProfile'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAvatarColor } from '@/lib/utils'

const supabase = createClient()

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  location_city: string | null
  location_department: string | null
  rating_average: number | null
  rating_count: number
  is_verified: boolean
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    document.title = 'Mi Perfil - Telopillo'
  }, [])

  // Use session from AuthProvider instead of getUser() — avoids duplicate session work and
  // navigator lock contention with onAuthStateChange (see AuthProvider).
  // Depends on user?.id only so TOKEN_REFRESHED (new User reference, same id) does not refetch.
  useEffect(() => {
    if (authLoading) return

    const userId = user?.id
    if (!userId) {
      setProfile(null)
      setBusinessSlug(null)
      setBusinessName(null)
      setError(null)
      router.replace('/login?redirect=/profile')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setError(null)
    setIsLoading(true)

    const loadProfile = async () => {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (cancelled) return
        if (profileError) throw profileError

        setProfile(data)

        const { data: business } = await supabase
          .from('business_profiles')
          .select('slug, business_name')
          .eq('id', userId)
          .maybeSingle()

        if (cancelled) return

        if (business) {
          setBusinessSlug(business.slug || null)
          setBusinessName(business.business_name || null)
        } else {
          setBusinessSlug(null)
          setBusinessName(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar perfil')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCreateBusiness = async () => {
    if (!profile) return

    try {
      setIsCreatingBusiness(true)
      const { data: slugResult } = await supabase.rpc('generate_slug', {
        input: profile.full_name,
      })

      const { error: insertError } = await supabase.from('business_profiles').insert({
        id: profile.id,
        business_name: profile.full_name,
        slug: slugResult || 'negocio',
      })

      if (insertError) throw insertError

      showToast('Negocio creado. Completa la información de tu tienda.', 'success')
      router.push('/profile/edit')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear negocio', 'error')
    } finally {
      setIsCreatingBusiness(false)
    }
  }

  const getInitials = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return 'U'
    return trimmed
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-BO', { year: 'numeric', month: 'long' })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-dvh items-center justify-center">
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md border border-border/60 shadow-md" role="alert">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Perfil no encontrado'}</p>
            <Button className="mt-4 min-h-[44px]" onClick={() => router.push('/')}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isProfileComplete =
    profile.full_name && profile.location_city && profile.location_department

  return (
    <div className="container mx-auto max-w-4xl min-w-0 px-4 py-8">
      <div className="min-w-0 space-y-6">
        {/* Profile Header Card */}
        <Card className="min-w-0 max-w-full border border-border/60 shadow-md">
          <CardHeader className="min-w-0 pb-4">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                <Avatar className="h-20 w-20 shrink-0">
                  <AvatarImage
                    src={profile.avatar_url || undefined}
                    alt={`Foto de perfil de ${profile.full_name}`}
                  />
                  <AvatarFallback className={`text-lg font-medium ${getAvatarColor(profile.id)}`}>
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 basis-0 self-stretch">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="min-w-0 max-w-full text-xl font-bold leading-tight break-words sm:text-2xl [overflow-wrap:anywhere] [word-break:break-word]">
                      {profile.full_name}
                    </h1>
                    {profile.is_verified && (
                      <Badge variant="default" className="shrink-0 gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <p className="text-pretty text-sm text-muted-foreground">
                    Miembro desde {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full min-w-0 shrink-0 min-h-[44px] touch-manipulation sm:w-auto sm:min-h-10"
                asChild
              >
                <Link href="/profile/edit" className="min-w-0">
                  <Edit className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Editar perfil
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              {user?.email && (
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Correo de la cuenta</p>
                    <p className="break-all text-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {profile.location_city && profile.location_department && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>
                    {profile.location_city}, {profile.location_department}
                  </span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="tabular-nums">{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {profile.rating_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 shrink-0 fill-yellow-400 text-yellow-400" aria-hidden />
                  <span className="font-semibold tabular-nums">
                    {profile.rating_average?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <span className="text-pretty text-sm text-muted-foreground">
                  ({profile.rating_count} {profile.rating_count === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            {/* Incomplete Profile Warning */}
            {!isProfileComplete && (
              <div
                className="rounded-md border border-yellow-200/90 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 shrink-0 text-yellow-700 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Completa tu perfil
                    </p>
                    <p className="mt-1 text-pretty text-sm text-yellow-900/90 dark:text-yellow-100/90">
                      Agrega ubicación y datos de contacto para publicar con confianza.
                    </p>
                    <Button className="mt-3 min-h-[44px] touch-manipulation sm:min-h-10" asChild>
                      <Link href="/profile/edit">Completar ahora</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Profile */}
        <ShareProfile profileId={profile.id} businessSlug={businessSlug} variant="card" />

        {/* Business Profile Section */}
        {businessName ? (
          <Card className="min-w-0 max-w-full border border-border/60 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <h2 className="text-balance text-lg font-semibold">Mi negocio</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-pretty text-sm text-muted-foreground">
                Tu negocio <span className="font-medium text-foreground">{businessName}</span> está
                activo en Telopillo.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                {businessSlug && (
                  <Button
                    variant="outline"
                    className="min-h-[44px] flex-1 touch-manipulation sm:min-h-10"
                    asChild
                  >
                    <Link href={`/negocio/${businessSlug}`}>
                      <Store className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                      Ver mi tienda
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="min-h-[44px] flex-1 touch-manipulation sm:min-h-10"
                  asChild
                >
                  <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    Editar negocio
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0 max-w-full border border-border/60 shadow-md">
            <CardHeader className="pb-3 text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
                <Store className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <h2 className="text-balance text-lg font-semibold">¿Tienes un negocio?</h2>
              <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">
                Tienda virtual con logo, horarios y redes. Puedes activarla cuando quieras.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleCreateBusiness}
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

        {/* Listings quick actions */}
        <Card className="min-w-0 max-w-full border border-border/60 shadow-md">
          <CardHeader>
            <h2 className="text-balance text-xl font-semibold">Mis productos</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                variant="outline"
                className="min-h-[44px] flex-1 touch-manipulation sm:min-h-10"
                asChild
              >
                <Link href="/perfil/mis-productos">
                  <Package className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Ver mis productos
                </Link>
              </Button>
              <Button className="min-h-[44px] flex-1 touch-manipulation sm:min-h-10" asChild>
                <Link href="/publicar">
                  <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                  Publicar producto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <div className="flex justify-center pt-2 pb-4">
          <Button
            variant="ghost"
            className="min-h-[44px] text-muted-foreground hover:text-destructive touch-manipulation"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
