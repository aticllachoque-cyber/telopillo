'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, MapPin, Phone, Star, Edit, LogOut, Package, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getAvatarColor } from '@/lib/utils'

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
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Mi Perfil - Telopillo.bo'
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
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
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Perfil no encontrado'}</p>
            <Button className="mt-4" onClick={() => router.push('/')}>
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
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Profile Header Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className={`text-lg font-medium ${getAvatarColor(profile.id)}`}>
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                    {profile.is_verified && (
                      <Badge variant="default" className="gap-1">
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
                  <p className="text-sm text-muted-foreground">
                    Miembro desde {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4" aria-hidden />
                    Editar
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Salir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Info */}
            <div className="grid gap-4 sm:grid-cols-2">
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
                  <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {profile.rating_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden />
                  <span className="font-semibold">
                    {profile.rating_average?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({profile.rating_count} {profile.rating_count === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}

            {/* Incomplete Profile Warning */}
            {!isProfileComplete && (
              <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-950">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
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
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Completa tu perfil
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Agrega tu ubicación y más información para empezar a publicar productos.
                    </p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href="/profile/edit">Completar ahora</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings quick actions */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <h2 className="text-xl font-semibold">Mis Publicaciones</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/perfil/mis-productos">
                  <Package className="mr-2 h-4 w-4" aria-hidden />
                  Ver mis publicaciones
                </Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/publicar">
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Crear Publicación
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
