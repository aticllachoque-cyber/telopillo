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
import {
  ClipboardList,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  User,
} from 'lucide-react'
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
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Ingresar</Link>
      </Button>
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
              alt={`Foto de perfil de ${profile?.full_name || 'Usuario'}`}
            />
            <AvatarFallback className={`font-medium ${getAvatarColor(user.id)}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuario'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div
          className="mb-2 rounded-lg border border-primary/25 bg-primary/5 p-1.5"
          role="group"
          aria-labelledby="user-menu-publicaciones-label"
        >
          <p
            id="user-menu-publicaciones-label"
            className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Publicaciones
          </p>
          <DropdownMenuItem asChild>
            <Link href="/perfil/mis-productos" className="cursor-pointer">
              <Package className="mr-2 size-4" aria-hidden />
              Mis productos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/perfil/demandas" className="cursor-pointer">
              <ClipboardList className="mr-2 size-4" aria-hidden />
              Mis solicitudes
            </Link>
          </DropdownMenuItem>
        </div>

        <div
          className="rounded-lg border border-border/80 bg-muted/40 p-1.5"
          role="group"
          aria-labelledby="user-menu-cuenta-label"
        >
          <p
            id="user-menu-cuenta-label"
            className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Cuenta
          </p>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 size-4" aria-hidden />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit" className="cursor-pointer">
              <Settings className="mr-2 size-4" aria-hidden />
              Editar perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/mensajes" className="cursor-pointer">
              <MessageSquare className="mr-2 size-4" aria-hidden />
              Mensajes
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 size-4" aria-hidden />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
