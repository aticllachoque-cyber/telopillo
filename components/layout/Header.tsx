'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = false // TODO: Replace with actual auth state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Telopillo.bo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-6 flex-1 justify-center"
          aria-label="Navegación principal"
        >
          <Link href="/buscar" className="text-sm font-medium transition-colors hover:text-primary">
            Buscar
          </Link>
          <Link
            href="/categorias"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Categorías
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild>
            <Link href="/publicar">Publicar</Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-publicaciones">Mis Publicaciones</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mensajes">Mensajes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t" role="dialog" aria-label="Menú de navegación">
          <nav className="container py-4 space-y-3" aria-label="Navegación principal">
            <Link
              href="/buscar"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Buscar
            </Link>
            <Link
              href="/categorias"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Categorías
            </Link>
            <Link
              href="/publicar"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Publicar
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/perfil"
                  className="block text-sm font-medium transition-colors hover:text-primary"
                >
                  Perfil
                </Link>
                <Link
                  href="/mensajes"
                  className="block text-sm font-medium transition-colors hover:text-primary"
                >
                  Mensajes
                </Link>
                <button className="block text-sm font-medium transition-colors hover:text-primary">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Iniciar Sesión
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
