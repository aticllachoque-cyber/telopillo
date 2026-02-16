'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getAvatarColor } from '@/lib/utils'
import { User, Settings, LogOut, Loader2, Package } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export function UserMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, isLoading, signOut } = useAuth()
  const isOnAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Cargando...</span>
      </Button>
    )
  }

  if (!user) {
    if (isOnAuthPage) return null

    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Iniciar Sesión
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Registrarse</Button>
        </Link>
      </div>
    )
  }

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-10 rounded-full"
          aria-label="Menú de usuario"
        >
          <Avatar className="size-9">
            <AvatarImage
              src={profile?.avatar_url || undefined}
              alt={profile?.full_name || 'Usuario'}
            />
            <AvatarFallback className={`font-medium ${getAvatarColor(user.id)}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuario'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 size-4" aria-hidden />
            Mi Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/perfil/mis-productos" className="cursor-pointer">
            <Package className="mr-2 size-4" aria-hidden />
            Mis Publicaciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="cursor-pointer">
            <Settings className="mr-2 size-4" aria-hidden />
            Editar Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 size-4" aria-hidden />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
